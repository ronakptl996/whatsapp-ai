import { Request, Response } from "express";
import fs from "fs";
import NodeCache from "node-cache";
import { Boom } from "@hapi/boom";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { supabase } from "../utils/Supabase";
import { logger } from "../utils/logger";
import { processMessage } from "../services/messageHandlers";

async function deleteSession(phoneNumber: string) {
  const sessionDir = `./sessions/${phoneNumber}`;
  if (fs.existsSync(sessionDir)) {
    fs.rmSync(sessionDir, { recursive: true, force: true });
    logger.info(`${phoneNumber} Deleted from Sessions`);
  }
  await supabase.from("bot").delete().eq("contact", phoneNumber);
  await supabase.from("users").delete().eq("contact", phoneNumber);
  await supabase.storage
    .from("session-files")
    .remove([`sessions/${phoneNumber}/creds.json`]);
}

function getPhoneNumbersFromSessions() {
  const sessionDirectories = fs
    .readdirSync("./sessions")
    .filter((file) => file.match(/^\d+$/));
  return sessionDirectories;
}

async function restoreSessionFromDB(phoneNumber: string, filePath: string) {
  try {
    logger.info(`Restoring session for phone number: ${phoneNumber}`);
    const sessionDir = `./sessions/${phoneNumber}`;
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { data, error } = await supabase.storage
      .from("session-files")
      .download(filePath);

    if (error) {
      logger.error("Error downloading session file", { error, phoneNumber });
      return;
    }

    const fileData = await data.text();

    if (typeof fileData === "object") {
      fs.writeFileSync(`${sessionDir}/creds.json`, fileData);
    }
    await createBot(phoneNumber);
  } catch (error) {
    logger.error("Error restoring session", { error, phoneNumber });
  }
}

interface BotCreateResult {
  socket: any;
  pairingCode: string | null;
}

async function createBot(
  phoneNumber: string,
  requestPairing: boolean = false,
): Promise<BotCreateResult> {
  try {
    const {
      default: makeWASocket,
      DisconnectReason,
      useMultiFileAuthState,
    } = await import("baileys");
    const sessionDir = `./sessions/${phoneNumber}`;

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const msgRetryCounterCache = new NodeCache();

    // flag to prevent multiple pairing code requests
    let pairingRequested = false;

    // Promise to resolve with pairing code if requested
    let resolvePairingCode: ((code: string) => void) | null = null;
    let rejectPairingCode: ((error: any) => void) | null = null;

    const pairingCodePromise = requestPairing
      ? new Promise<string>((resolve, reject) => {
          resolvePairingCode = resolve;
          rejectPairingCode = reject;
          // Timeout after 30 seconds
          setTimeout(
            () => reject(new Error("Pairing code request timeout")),
            30000,
          );
        })
      : null;

    const Matrix = makeWASocket({
      printQRInTerminal: false,
      browser: ["Mac OS", "chrome", "121.0.6167.159"],
      auth: state,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      version: [2, 3000, 1033893291],
      getMessage: async (key) => ({ conversation: "Hello, World!" }),
      msgRetryCounterCache,
    });

    Matrix.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      logger.debug("Connection update", { connection, qr });

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {
          logger.info(`Reconnecting ${phoneNumber}`);
          setTimeout(() => createBot(phoneNumber, false), 5000);
        } else {
          logger.warn(`Device ${phoneNumber} logged out`);
          await deleteSession(phoneNumber);
        }
      } else if (connection === "open") {
        logger.info(`Device ${phoneNumber} connected to WhatsApp`);
      } else if (
        (connection === "connecting" || !!qr) &&
        requestPairing &&
        !pairingRequested
      ) {
        pairingRequested = true;
        logger.info(
          `Device ${phoneNumber} is connecting, requesting pairing code`,
        );
        try {
          setTimeout(async () => {
            const code = await Matrix.requestPairingCode(phoneNumber);
            logger.info(`Pairing code generated for ${phoneNumber}`, { code });

            if (resolvePairingCode) {
              resolvePairingCode(code);
            }
          }, 3000);
        } catch (error) {
          logger.error("Error generating pairing code", { error, phoneNumber });
          pairingRequested = false;
          if (rejectPairingCode) {
            rejectPairingCode(error);
          }
        }
      }
    });

    Matrix.ev.on("creds.update", saveCreds);

    // Handle incoming messages
    Matrix.ev.on("messages.upsert", async (m) => {
      logger.debug("Messages upsert received", {
        type: m.type,
        count: m.messages.length,
      });

      if (m.type === "notify") {
        for (const message of m.messages) {
          await processMessage(message, Matrix, message.key);
        }
      }
    });

    const { data, error: botQueryError } = await supabase
      .from("bot")
      .select(
        `
          id,
          contact
        `,
      )
      .eq("contact", parseInt(phoneNumber));

    if (botQueryError) {
      logger.error("Error querying bot from Supabase", {
        error: botQueryError,
        phoneNumber,
      });
    }

    if (data && data.length === 0) {
      const credsPath = `${sessionDir}/creds.json`;

      if (fs.existsSync(credsPath)) {
        const creds = fs.readFileSync(credsPath);
        const { data: storageData, error } = await supabase.storage
          .from("session-files")
          .upload(credsPath, creds, {
            contentType: "application/json",
            upsert: true,
          });

        if (error) {
          logger.error("Error uploading session file to Supabase", {
            error,
            phoneNumber,
          });
          throw new ApiError(500, "Error uploading session file to Supabase");
        }

        if (storageData) {
          const { data, error } = await supabase
            .from("bot")
            .insert([
              {
                contact: phoneNumber,
                filePath: storageData.fullPath,
                filePathId: storageData.id,
              },
            ])
            .select();

          if (error) {
            logger.error("Error creating bot in Supabase", {
              error,
              phoneNumber,
            });
          } else {
            logger.info("Created User Bot", { data, phoneNumber });
          }
        }
      }
    }

    // Return socket and pairing code promise if requested
    if (requestPairing && pairingCodePromise) {
      const pairingCode = await pairingCodePromise;
      return { socket: Matrix, pairingCode };
    }

    return { socket: Matrix, pairingCode: null };
  } catch (error) {
    logger.error("Error creating bot", { error, phoneNumber });
    await deleteSession(phoneNumber);
    throw error;
  }
}

const pairingRoute = asyncHandler(async (req: Request, res: Response) => {
  try {
    let { phoneNumber, isUpdate } = req.body;

    if (!phoneNumber) {
      return res
        .status(400)
        .json(new ApiResponse(400, [], "Invalid phone number"));
    }

    if (isUpdate) {
      const oldNumber = req.body.oldNumber;
      if (!oldNumber) {
        return res
          .status(400)
          .json(new ApiResponse(400, [], "Old number is required for updates"));
      }
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

    logger.info(`Creating bot for phone number: ${phoneNumber}`, { isUpdate });
    const result = await createBot(phoneNumber, true);

    if (!result || !result.socket) {
      throw new ApiError(500, "Bot creation failed");
    }

    if (!result.pairingCode) {
      throw new ApiError(500, "Failed to generate pairing code");
    }

    // Format pairing code with dashes for better readability (e.g., "1234-5678")
    const formattedCode =
      result.pairingCode.match(/.{1,4}/g)?.join("-") || result.pairingCode;

    logger.info(`Pairing code generated successfully`, { phoneNumber });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { pairingCode: formattedCode },
          "Pairing code generated successfully",
        ),
      );
  } catch (error) {
    logger.error("Error generating pairing code", {
      error,
      phoneNumber: req.body.phoneNumber,
    });
    return res
      .status(500)
      .json(new ApiError(500, "Error generating pairing code"));
  }
});

async function reloadBots() {
  try {
    logger.info("Reloading all bots...");

    const phoneNumbers = getPhoneNumbersFromSessions();
    logger.info(`Found ${phoneNumbers.length} local sessions`);

    const { data, error } = await supabase.from("bot").select();

    if (error) {
      logger.error("Error fetching bots from Supabase", { error });
      return;
    }

    const phoneNumbersInDB = data?.map((user) => user.contact) || [];
    logger.info(`Found ${phoneNumbersInDB.length} bots in database`);

    // Restore bots from local sessions
    for (const phoneNumber of phoneNumbers) {
      logger.info(`Restoring bot from local session: ${phoneNumber}`);
      await createBot(phoneNumber);
    }

    // Restore bots from DB that don't have local sessions
    for (const phoneNumber of phoneNumbersInDB) {
      if (!phoneNumbers.includes(String(phoneNumber))) {
        const user = data.find((user) => user.contact === Number(phoneNumber));
        if (user) {
          logger.info(`Restoring bot from DB: ${phoneNumber}`);
          await restoreSessionFromDB(phoneNumber, user.filePath.slice(14));
        }
      }
    }

    logger.info("Bot reload completed successfully");
  } catch (error) {
    logger.error("Error during bot reload", { error });
    throw error;
  }
}

export { pairingRoute, reloadBots };
