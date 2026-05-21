import fs from "fs";
import path from "path";

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Get current log level from environment
const getLogLevel = (): LogLevel => {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  switch (level) {
    case "error":
      return LogLevel.ERROR;
    case "warn":
      return LogLevel.WARN;
    case "info":
      return LogLevel.INFO;
    case "debug":
      return LogLevel.DEBUG;
    default:
      return LogLevel.INFO;
  }
};

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create log file name with date
const getLogFileName = () => {
  const date = new Date().toISOString().split("T")[0];
  return path.join(logsDir, `${date}.log`);
};

// Write to log file
const writeToFile = (message: string) => {
  try {
    fs.appendFileSync(getLogFileName(), `${message}\n`);
  } catch (error) {
    // Silently fail if can't write to file
  }
};

// Format log message
const formatMessage = (
  level: string,
  message: string,
  meta?: any
): string => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] ${level}: ${message}${metaStr}`;
};

// Logger class
class Logger {
  private level: LogLevel;

  constructor() {
    this.level = getLogLevel();
  }

  error(message: string, meta?: any) {
    if (this.level >= LogLevel.ERROR) {
      const formatted = formatMessage("ERROR", message, meta);
      console.error(formatted);
      writeToFile(formatted);
    }
  }

  warn(message: string, meta?: any) {
    if (this.level >= LogLevel.WARN) {
      const formatted = formatMessage("WARN", message, meta);
      console.warn(formatted);
      writeToFile(formatted);
    }
  }

  info(message: string, meta?: any) {
    if (this.level >= LogLevel.INFO) {
      const formatted = formatMessage("INFO", message, meta);
      console.info(formatted);
      writeToFile(formatted);
    }
  }

  debug(message: string, meta?: any) {
    if (this.level >= LogLevel.DEBUG) {
      const formatted = formatMessage("DEBUG", message, meta);
      console.debug(formatted);
      writeToFile(formatted);
    }
  }
}

export const logger = new Logger();
