import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Hex } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { logger } from "../logger"

// The max limit is 1000 events per request
// https://github.com/vechain/thor/blob/master/docs/command_line_arguments.md
const MAX_EVENTS_PER_REQUEST = 1000

export interface AutoVotingEnabledUsersResult {
  /** Map of user addresses to their auto-voting enabled state */
  userAutoVotingState: Map<string, boolean>
  /** Whether there are more events to fetch */
  hasMore: boolean
  /** Number of events fetched in this request */
  eventCount: number
}

/**
 * Gets users who have auto-voting enabled by fetching AutoVotingToggled events
 *
 * SNAPSHOT BEHAVIOR:
 * - This function reconstructs the auto-voting state at a specific timepoint (toBlock)
 * - It processes all toggle events chronologically up to toBlock
 * - For users who toggled multiple times, only their final state at toBlock matters
 * - This mirrors the contract's checkpoint-based storage (upperLookupRecent)
 *
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param fromBlock - The starting block number
 * @param toBlock - The snapshot block (typically round start block)
 * @param offset - The offset for pagination (default: 0)
 * @returns Object containing user states at the snapshot, pagination info
 */
export const getAutoVotingEnabledUsers = async (
  thor: ThorClient,
  contractAddress: string,
  fromBlock: number,
  toBlock?: number,
  offset: number = 0,
): Promise<AutoVotingEnabledUsersResult> => {
  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const autoVotingToggledEvent = xAllocationVotingContract.getEvent("AutoVotingToggled") as any
  const topics = autoVotingToggledEvent.encodeFilterTopicsNoNull({})

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
        criteria: {
          address: contractAddress,
          topic0: topics[0],
        },
        eventAbi: autoVotingToggledEvent,
      },
    ],
  })

  // Map to store each user's final state at the snapshot block
  // If a user toggles multiple times, later events overwrite earlier ones
  const userStateAtSnapshot = new Map<string, boolean>()

  for (const log of logs) {
    const accountTopic = log.topics?.[1] as string

    const decodedData = autoVotingToggledEvent.decodeEventLog({
      topics: log.topics.map((topic: string) => Hex.of(topic)),
      data: Hex.of(log.data),
    })

    if (accountTopic) {
      const walletAddress = decodedData.args.account as string
      const enabled = decodedData.args.enabled as boolean
      // Overwrite previous state - only the final state at snapshot matters
      userStateAtSnapshot.set(walletAddress, enabled)
    }
  }

  // If we got exactly MAX_EVENTS_PER_REQUEST, there might be more
  const hasMore = logs.length === MAX_EVENTS_PER_REQUEST

  return {
    userAutoVotingState: userStateAtSnapshot,
    hasMore,
    eventCount: logs.length,
  }
}

/**
 * Gets all users who have auto-voting enabled by fetching all AutoVotingToggled events with pagination
 *
 * IMPORTANT: This function queries from block 0 to reconstruct the complete history.
 * This ensures we capture the correct state at the snapshot regardless of when users toggled.
 *
 * Examples:
 * - User ON at block 50, snapshot at 100 → INCLUDED (was ON at snapshot)
 * - User ON at 50, OFF at 80, snapshot at 100 → EXCLUDED (was OFF at snapshot)
 * - User ON at 50, OFF at 150, snapshot at 100 → INCLUDED (OFF happened after snapshot)
 *
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param fromBlock - The starting block number (typically 0 to get full history)
 * @param toBlock - The snapshot block (typically round start block)
 * @returns Array of user addresses with auto-voting enabled at the snapshot
 */
export const getAllAutoVotingEnabledUsers = async (
  thor: ThorClient,
  contractAddress: string,
  fromBlock: number,
  toBlock?: number,
): Promise<string[]> => {
  logger.info("Fetching AutoVotingToggled events", {
    fromBlock,
    toBlock: toBlock || "latest",
  })

  // Aggregate map to store each user's final state at snapshot across all paginated results
  const userStateAtSnapshot = new Map<string, boolean>()
  let offset = 0
  let totalEvents = 0

  // Loop through all pages of events
  while (true) {
    logger.info("Fetching events page", { offset, limit: MAX_EVENTS_PER_REQUEST })
    const result = await getAutoVotingEnabledUsers(thor, contractAddress, fromBlock, toBlock, offset)
    logger.info("Events page received", {
      eventCount: result.eventCount,
      hasMore: result.hasMore,
      offset,
    })

    // Merge paginated results - each page may contain updates to the same users
    for (const [user, enabled] of result.userAutoVotingState.entries()) {
      userStateAtSnapshot.set(user, enabled)
    }

    totalEvents += result.eventCount

    // Break if there are no more events
    if (!result.hasMore) {
      logger.info("Pagination complete", { totalEvents })
      break
    }

    // Move to the next page
    offset += MAX_EVENTS_PER_REQUEST
  }

  // Grab only wallets that have enabled status
  const enabledUsersAtSnapshot = Array.from(userStateAtSnapshot.entries())
    .filter(([_user, isEnabled]) => isEnabled === true)
    .map(([user, _isEnabled]) => user)

  logger.info("AutoVotingToggled events processed", {
    totalEvents,
    activeUsersAtSnapshot: enabledUsersAtSnapshot.length,
  })

  return enabledUsersAtSnapshot
}
