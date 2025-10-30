import { ThorClient } from "@vechain/sdk-network"
import { ABIContract } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { logger } from "../logger"
import { aggregateAllEvents } from "../events"

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
