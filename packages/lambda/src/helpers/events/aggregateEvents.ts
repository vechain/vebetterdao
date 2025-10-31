import { ThorClient } from "@vechain/sdk-network"
import { Hex } from "@vechain/sdk-core"
import { logger } from "../logger"

// The max limit is 1000 events per request
// https://github.com/vechain/thor/blob/master/docs/command_line_arguments.md
const MAX_EVENTS_PER_REQUEST = 1000

/**
 * Generic result interface for event aggregation
 */
export interface EventAggregationResult<T> {
  /** The aggregated result */
  result: T
  /** Whether there are more events to fetch */
  hasMore: boolean
  /** Number of events fetched in this request */
  eventCount: number
}

/**
 * Generic function to fetch and aggregate events with pagination support
 *
 * This function fetches blockchain events and aggregates them using a custom aggregation function.
 * It's designed to be reusable for any type of event aggregation across the codebase.
 *
 * @param thor - The ThorClient instance
 * @param contractAddress - The contract address to query events from
 * @param eventAbi - The event ABI to decode logs
 * @param topics - The encoded topics for filtering (use encodeFilterTopicsNoNull with event parameters)
 * @param fromBlock - The starting block number
 * @param toBlock - The ending block number (optional)
 * @param aggregateFn - Function to aggregate each log into the accumulator
 * @param initialValue - Initial value for the accumulator
 * @param offset - The offset for pagination (default: 0)
 * @returns Object containing aggregated result, pagination info
 *
 */
export const aggregateEvents = async <T>(
  thor: ThorClient,
  contractAddress: string,
  eventAbi: any,
  topics: any[],
  fromBlock: number,
  toBlock: number | undefined,
  aggregateFn: (accumulator: T, log: any, decodedData: any) => T,
  initialValue: T,
  offset: number = 0,
): Promise<EventAggregationResult<T>> => {
  // Build criteria object with only defined topics
  // Topics structure:
  //   topic0: event signature hash (always present)
  //   topic1: first indexed parameter (if specified in filter)
  //   topic2: second indexed parameter (if specified in filter)
  //   topic3: third indexed parameter (if specified in filter)
  const criteria: any = {
    address: contractAddress,
    topic0: topics[0], // event signature (always present)
  }

  // Add indexed parameters if they exist (only include non-null topics)
  if (topics[1] !== null) {
    criteria.topic1 = topics[1] // indexed parameter 1 (e.g., cycle)
  }
  if (topics[2] !== null) {
    criteria.topic2 = topics[2] // indexed parameter 2 (e.g., voter)
  }
  if (topics[3] !== null) {
    criteria.topic3 = topics[3] // indexed parameter 3 (if exists)
  }

  // Debug logging for first call (offset 0)
  if (offset === 0) {
    logger.info("Filter criteria being used", {
      criteria,
      topicsLength: topics.length,
      fromBlock,
      toBlock: toBlock || "latest",
    })
  }

  const logs = await thor.logs.filterEventLogs({
    range: {
      unit: "block" as const,
      from: fromBlock,
      to: toBlock,
    },
    options: {
      offset,
      limit: MAX_EVENTS_PER_REQUEST,
    },
    order: "asc",
    criteriaSet: [
      {
        criteria,
        eventAbi: eventAbi,
      },
    ],
  })

  // Aggregate all logs using the provided aggregation function
  let accumulator = initialValue
  for (const log of logs) {
    const decodedData = eventAbi.decodeEventLog({
      topics: log.topics.map((topic: string) => Hex.of(topic)),
      data: Hex.of(log.data),
    })
    accumulator = aggregateFn(accumulator, log, decodedData)
  }

  // If we got exactly MAX_EVENTS_PER_REQUEST, there might be more
  const hasMore = logs.length === MAX_EVENTS_PER_REQUEST

  return {
    result: accumulator,
    hasMore,
    eventCount: logs.length,
  }
}

/**
 * Generic function to fetch and aggregate all events with automatic pagination
 *
 * This function automatically handles pagination by repeatedly calling `aggregateEvents`
 * until all events in the specified block range are processed.
 *
 * @param thor - The ThorClient instance
 * @param contractAddress - The contract address to query events from
 * @param eventAbi - The event ABI to decode logs
 * @param topics - The encoded topics for filtering (use encodeFilterTopicsNoNull with event parameters)
 * @param fromBlock - The starting block number
 * @param toBlock - The ending block number (optional)
 * @param aggregateFn - Function to aggregate each log into the accumulator
 * @param initialValue - Initial value for the accumulator
 * @returns The final aggregated result after processing all pages
 *
 */
export const aggregateAllEvents = async <T>(
  thor: ThorClient,
  contractAddress: string,
  eventAbi: any,
  topics: any[],
  fromBlock: number,
  toBlock: number | undefined,
  aggregateFn: (accumulator: T, log: any, decodedData: any) => T,
  initialValue: T,
  showLogs: boolean = false,
): Promise<{ result: T; totalEvents: number }> => {
  let accumulator = initialValue
  let offset = 0
  let totalEvents = 0

  // Loop through all pages of events
  while (true) {
    logger.info("Fetching events page", { offset, limit: MAX_EVENTS_PER_REQUEST })

    const { result, hasMore, eventCount } = await aggregateEvents(
      thor,
      contractAddress,
      eventAbi,
      topics,
      fromBlock,
      toBlock,
      aggregateFn,
      accumulator,
      offset,
    )

    if (showLogs) {
      logger.info("Events page received", {
        eventCount,
        hasMore,
        offset,
      })
    }

    // Update accumulator with results from this page
    accumulator = result
    totalEvents += eventCount

    // Break if there are no more events
    if (!hasMore) {
      logger.info("Pagination complete", { totalEvents })
      break
    }

    // Move to the next page
    offset += MAX_EVENTS_PER_REQUEST
  }

  return { result: accumulator, totalEvents }
}
