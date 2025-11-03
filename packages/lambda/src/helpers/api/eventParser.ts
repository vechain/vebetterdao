/**
 * Parse the dryRun flag from a Lambda event payload
 * Supports both direct invocation (EventBridge) and API Gateway events
 * @param event - The Lambda event object
 * @returns The parsed dryRun flag (defaults to false if not found or parsing fails)
 */
export const parseDryRunFlag = (event: any): boolean => {
  try {
    // Check direct event property (for EventBridge/direct invocation)
    if (event.dryRun !== undefined) {
      return event.dryRun === true
    }

    // Check body property (for API Gateway)
    if (event.body) {
      const body = JSON.parse(event.body)
      return body.dryRun === true
    }

    // Default to false if not found
    return false
  } catch {
    // If parsing fails, default to false
    return false
  }
}
