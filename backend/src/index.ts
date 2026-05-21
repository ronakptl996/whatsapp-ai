import dotenv from "dotenv";
import { app } from "./app";
import { reloadBots } from "./controllers/whatsApp.controllers";
import { logger } from "./utils/logger";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  logger.info(`Starting server on port ${PORT}...`);
  
  reloadBots()
    .then(() => {
      logger.info(`⚙️ Server is running at port: ${PORT}`);
    })
    .catch((err) => {
      logger.error("Error while reloading bots", { error: err });
    });
});
