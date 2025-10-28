import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Hex } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"

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
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param fromBlock - The starting block number
 * @param toBlock - The ending block number (optional, defaults to latest)
 * @param offset - The offset for pagination (default: 0)
 * @returns Object containing user states, pagination info
 */
export const getAutoVotingEnabledUsers = async (
  thor: ThorClient,
  contractAddress: string,
  fromBlock: number,
  toBlock?: number,
  offset: number = 0,
): Promise<AutoVotingEnabledUsersResult> => {
  console.log(`Fetching AutoVotingToggled events from block ${fromBlock} to ${toBlock || "latest"} (offset: ${offset})`)

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

  console.log(`Found ${logs.length} AutoVotingToggled events at offset ${offset}`)

  // Map to store the latest state for each user
  const userAutoVotingState = new Map<string, boolean>()

  for (const log of logs) {
    const accountTopic = log.topics?.[1] as string

    const decodedData = autoVotingToggledEvent.decodeEventLog({
      topics: log.topics.map((topic: string) => Hex.of(topic)),
      data: Hex.of(log.data),
    })

    if (accountTopic) {
      const walletAddress = decodedData.args.account as string
      const enabled = decodedData.args.enabled as boolean
      // Overwrite the previous state if the same user is toggled multiple times
      userAutoVotingState.set(walletAddress, enabled)
    }
  }

  // If we got exactly MAX_EVENTS_PER_REQUEST, there might be more
  const hasMore = logs.length === MAX_EVENTS_PER_REQUEST

  return {
    userAutoVotingState,
    hasMore,
    eventCount: logs.length,
  }
}

/**
 * Gets all users who have auto-voting enabled by fetching all AutoVotingToggled events with pagination
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param fromBlock - The starting block number
 * @param toBlock - The ending block number (optional, defaults to latest)
 * @returns Array of user addresses with auto-voting enabled
 */
export const getAllAutoVotingEnabledUsers = async (
  thor: ThorClient,
  contractAddress: string,
  fromBlock: number,
  toBlock?: number,
): Promise<string[]> => {
  console.log(`Fetching all AutoVotingToggled events from block ${fromBlock} to ${toBlock || "latest"}`)

  // Aggregate map to store the latest state for each user across all pages
  const aggregatedUserState = new Map<string, boolean>()
  let offset = 0
  let totalEvents = 0

  // Loop through all pages
  while (true) {
    const result = await getAutoVotingEnabledUsers(thor, contractAddress, fromBlock, toBlock, offset)

    // Merge the results into the aggregated map
    for (const [user, enabled] of result.userAutoVotingState.entries()) {
      aggregatedUserState.set(user, enabled)
    }

    totalEvents += result.eventCount

    // Break if there are no more events
    if (!result.hasMore) {
      break
    }

    // Move to the next page
    offset += MAX_EVENTS_PER_REQUEST
  }

  console.log(`Fetched ${totalEvents} total AutoVotingToggled events`)

  // Filter to only enabled users
  const enabledUsers = Array.from(aggregatedUserState.entries())
    .filter(([_, enabled]) => enabled)
    .map(([account]) => account)

  console.log(`Found ${enabledUsers.length} users with auto-voting active`)

  return enabledUsers
}
