/**
 * Logger for Lambda functions
 */

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: "INFO", message, ...data, timestamp: new Date().toISOString() }))
  },

  warn: (message: string, data?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: "WARN", message, ...data, timestamp: new Date().toISOString() }))
  },

  error: (message: string, error?: Error | unknown, data?: Record<string, unknown>) => {
    const errorData = error instanceof Error ? { error: error.message, stack: error.stack } : { error }
    console.error(
      JSON.stringify({ level: "ERROR", message, ...errorData, ...data, timestamp: new Date().toISOString() }),
    )
  },
}
