import winston from "winston"

const timestamp = new Date().toISOString().replace(/:/g, "-")

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({
      filename: `./logs/logs-${timestamp}.log`,
      format: winston.format.combine(
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`),
      ),
    }),
  ],
})
