import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

// Импортируем как побочный эффект

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} [${level.toUpperCase()}]: ${message}`,
    ),
  ),
  transports: [
    new transports.Console(),
    new transports.DailyRotateFile({
      filename: "logs/server-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

export default logger;
