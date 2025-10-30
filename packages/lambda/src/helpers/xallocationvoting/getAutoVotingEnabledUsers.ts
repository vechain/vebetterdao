import { ThorClient } from "@vechain/sdk-network"
import { ABIContract } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { logger } from "../logger"
import { aggregateEvents, aggregateAllEvents } from "../events"

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

  // Aggregation function: Map to store each user's final state at the snapshot block
  // If a user toggles multiple times, later events overwrite earlier ones
  const aggregateFn = (userStateAtSnapshot: Map<string, boolean>, log: any, decodedData: any): Map<string, boolean> => {
    const accountTopic = log.topics?.[1] as string
    if (accountTopic) {
      const walletAddress = decodedData.args.account as string
      const enabled = decodedData.args.enabled as boolean
      // Overwrite previous state - only the final state at snapshot matters
      userStateAtSnapshot.set(walletAddress, enabled)
    }
    return userStateAtSnapshot
  }

  const { result, hasMore, eventCount } = await aggregateEvents(
    thor,
    contractAddress,
    autoVotingToggledEvent,
    topics,
    fromBlock,
    toBlock,
    aggregateFn,
    new Map<string, boolean>(),
    offset,
  )

  return {
    userAutoVotingState: result,
    hasMore,
    eventCount,
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

  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const autoVotingToggledEvent = xAllocationVotingContract.getEvent("AutoVotingToggled") as any
  const topics = autoVotingToggledEvent.encodeFilterTopicsNoNull({})

  // Aggregation function: Map to store each user's final state at the snapshot block
  // If a user toggles multiple times, later events overwrite earlier ones
  const aggregateFn = (userStateAtSnapshot: Map<string, boolean>, log: any, decodedData: any): Map<string, boolean> => {
    const accountTopic = log.topics?.[1] as string
    if (accountTopic) {
      const walletAddress = decodedData.args.account as string
      const enabled = decodedData.args.enabled as boolean
      // Overwrite previous state - only the final state at snapshot matters
      userStateAtSnapshot.set(walletAddress, enabled)
    }
    return userStateAtSnapshot
  }

  const { result: userStateAtSnapshot, totalEvents } = await aggregateAllEvents(
    thor,
    contractAddress,
    autoVotingToggledEvent,
    topics,
    fromBlock,
    toBlock,
    aggregateFn,
    new Map<string, boolean>(),
  )

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
