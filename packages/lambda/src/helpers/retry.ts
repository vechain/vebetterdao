/**
 * Helper function to retry an async operation with a specified number of attempts
 *
 * @param operation - The async function to retry
 * @param maxAttempts - Maximum number of retry attempts
 * @param delayMs - Delay between retries in milliseconds
 * @param operationName - Name of the operation for logging purposes
 * @returns The result of the operation if successful
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 5,
  delayMs: number = 3000,
  operationName: string = "Operation",
): Promise<T> {
  let lastError: any

  console.log(`Starting ${operationName} with max ${maxAttempts} attempts`)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`${operationName}: Attempt ${attempt}/${maxAttempts}`)
      const result = await operation()
      console.log(`${operationName}: Successful on attempt ${attempt}/${maxAttempts}`)
      return result
    } catch (error) {
      lastError = error
      console.log(`${operationName}: Attempt ${attempt}/${maxAttempts} failed with error:`, error)

      if (attempt < maxAttempts) {
        console.log(`${operationName}: Retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }

  console.log(`${operationName}: Failed after ${maxAttempts} attempts`)
  throw lastError || new Error(`${operationName} failed after maximum retry attempts`)
}
