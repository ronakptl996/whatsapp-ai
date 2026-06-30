import { logger } from "../utils/logger";
import { chatWithAI, generateImage } from "./whatsApp.service";

interface MessageHandler {
  pattern: RegExp;
  handler: (message: any, sock: any, key: any) => Promise<void>;
}

// Menu command handler
const handleMenu = async (message: any, sock: any, key: any) => {
  const pushName = message.pushName || "User";
  await sock.sendMessage(key.remoteJid!, {
    text: `Hello ${pushName},

*Menu Command*

1. /menu - Menu Command
2. /ai - AI Chat
3. /image - Generate Image`,
  });
  logger.info("Menu command executed", { remoteJid: key.remoteJid });
};

// AI Chat handler
const handleAIChat = async (message: any, sock: any, key: any) => {
  try {
    const chatMessage =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.protocolMessage?.editedMessage?.conversation;

    if (!chatMessage) {
      await sock.sendMessage(key.remoteJid!, {
        text: "Please provide a message after /ai command",
      });
      return;
    }

    // Remove the /ai prefix
    const userMessage = chatMessage.replace(/^\/ai\s*/i, "").trim();

    if (!userMessage) {
      await sock.sendMessage(key.remoteJid!, {
        text: "Please provide a message after /ai command. Example: /ai What is JavaScript?",
      });
      return;
    }

    const response = await chatWithAI(userMessage);
    await sock.sendMessage(key.remoteJid!, { text: response });
    logger.info("AI chat response sent", { remoteJid: key.remoteJid });
  } catch (error) {
    logger.error("Error in AI chat", { error, remoteJid: key.remoteJid });
    await sock.sendMessage(key.remoteJid!, {
      text: "Sorry, I encountered an error while processing your request. Please try again later.",
    });
  }
};

// Image generation handler
const handleImageGeneration = async (message: any, sock: any, key: any) => {
  try {
    const chatMessage =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text;

    if (!chatMessage) {
      await sock.sendMessage(key.remoteJid!, {
        text: "Please provide a prompt after /image command",
      });
      return;
    }

    // Remove the /image prefix
    const prompt = chatMessage.replace(/^\/image\s*/i, "").trim();

    if (!prompt) {
      await sock.sendMessage(key.remoteJid!, {
        text: "Please provide a prompt after /image command. Example: /image a beautiful sunset",
      });
      return;
    }

    // Notify user that image is being generated
    await sock.sendMessage(key.remoteJid!, {
      text: "🎨 Generating your image... This may take a moment.",
    });

    // Generate the image
    const imagePath = await generateImage(prompt);

    if (imagePath) {
      // Send the generated image
      await sock.sendMessage(key.remoteJid!, {
        image: { url: imagePath },
        caption: `Here's your generated image for: "${prompt}"`,
      });
      logger.info("Image generated and sent", { remoteJid: key.remoteJid, prompt });
    } else {
      await sock.sendMessage(key.remoteJid!, {
        text: "Sorry, I encountered an error while generating the image. Please try again later.",
      });
    }
  } catch (error) {
    logger.error("Error in image generation", { error, remoteJid: key.remoteJid });
    await sock.sendMessage(key.remoteJid!, {
      text: "Sorry, I encountered an error while generating the image. Please try again later.",
    });
  }
};

// Ping handler
const handlePing = async (message: any, sock: any, key: any) => {
  await sock.sendMessage(key.remoteJid!, { text: "Pong!" });
  logger.debug("Ping response sent", { remoteJid: key.remoteJid });
};

// Message router - maps patterns to handlers
export const messageHandlers: MessageHandler[] = [
  {
    pattern: /^\/menu$/i,
    handler: handleMenu,
  },
  {
    pattern: /^\/ai/i,
    handler: handleAIChat,
  },
  {
    pattern: /^\/image/i,
    handler: handleImageGeneration,
  },
  {
    pattern: /ping/i,
    handler: handlePing,
  },
];

// Process incoming message and route to appropriate handler
export const processMessage = async (
  message: any,
  sock: any,
  key: any
): Promise<void> => {
  const text =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    "";

  if (!text) return;

  const lowerText = text.toLowerCase();

  // Find matching handler
  for (const handler of messageHandlers) {
    if (handler.pattern.test(lowerText)) {
      await handler.handler(message, sock, key);
      return;
    }
  }
};
