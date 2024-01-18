import winston, { format } from "winston"

// Custom format
const levelConditionalFormat = format.printf(({ level, message, ...meta }) => {
  let log = ""

  if (level === "warn" || level === "error") {
    log = `${level}: ${message}`
  } else {
    log = `${message}`
  }

  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`
  }

  return log
})

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), levelConditionalFormat),
    }),
  ],
})
