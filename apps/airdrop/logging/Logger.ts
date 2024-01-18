import winston from "winston"

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
})
