/**
 * Auto-Voting Round Analytics Script
 *
 * Analyzes auto-voting activity per round since the feature went live (Round 65).
 * Outputs data to console and saves to JSON file.
 *
 * Usage:
 *   cd packages/scripts
 *   yarn install
 *   yarn analyze-auto-voting
 */

import { ThorClient, MAINNET_URL } from "@vechain/sdk-network"
import { ABIContract, Hex } from "@vechain/sdk-core"
import {
  XAllocationVoting__factory,
  VoterRewards__factory,
  RelayerRewardsPool__factory,
} from "@vechain/vebetterdao-contracts/typechain-types"
import * as fs from "fs"
import * as path from "path"

import mainnetConfig from "@repo/config/mainnet"

// First round with auto-voting enabled on mainnet
const FIRST_AUTO_VOTING_ROUND = 65

// Contract addresses from mainnet config
const CONFIG = mainnetConfig

interface RoundAnalytics {
  roundId: number
  autoVotingUsersCount: number
  votedForCount: number
  rewardsClaimedCount: number
  relayerRewardsClaimable: boolean
  relayerRewardsClaimableReason: string
  totalRelayerRewards: string
  totalRelayerRewardsRaw: string
  numRelayers: number
  vthoSpentOnVoting: string
  vthoSpentOnVotingRaw: string
  vthoSpentOnClaiming: string
  vthoSpentOnClaimingRaw: string
  vthoSpentTotal: string
  vthoSpentTotalRaw: string
}

interface AnalyticsReport {
  generatedAt: string
  network: string
  firstRound: number
  currentRound: number
  rounds: RoundAnalytics[]
}

// ============ Contract Helper Functions ============

/**
 * Get the current round ID from XAllocationVoting
 */
async function getCurrentRoundId(thor: ThorClient, contractAddress: string): Promise<number> {
  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const result = await thor.contracts.executeCall(
    contractAddress,
    xAllocationVotingContract.getFunction("currentRoundId"),
    [],
  )

  if (!result.success) {
    throw new Error("Failed to get current round ID")
  }

  return Number(result.result?.array?.[0] ?? 0)
}

/**
 * Get the round snapshot (start block) for a given round
 */
async function getRoundSnapshot(thor: ThorClient, contractAddress: string, roundId: number): Promise<number> {
  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const result = await thor.contracts.executeCall(
    contractAddress,
    xAllocationVotingContract.getFunction("roundSnapshot"),
    [roundId],
  )

  if (!result.success) {
    throw new Error(`Failed to get round snapshot for round ${roundId}`)
  }

  return Number(result.result?.array?.[0] ?? 0)
}

/**
 * Get the round deadline (end block) for a given round
 */
async function getRoundDeadline(thor: ThorClient, contractAddress: string, roundId: number): Promise<number> {
  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const result = await thor.contracts.executeCall(
    contractAddress,
    xAllocationVotingContract.getFunction("roundDeadline"),
    [roundId],
  )

  if (!result.success) {
    throw new Error(`Failed to get round deadline for round ${roundId}`)
  }

  return Number(result.result?.array?.[0] ?? 0)
}

/**
 * Get all users who have auto-voting enabled at a specific block
 * by aggregating AutoVotingToggled events
 */
async function getAllAutoVotingEnabledUsers(
  thor: ThorClient,
  contractAddress: string,
  fromBlock: number,
  toBlock: number,
): Promise<string[]> {
  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const autoVotingToggledEvent = xAllocationVotingContract.getEvent("AutoVotingToggled") as any
  const topics = autoVotingToggledEvent.encodeFilterTopicsNoNull({})

  const userStateAtSnapshot = new Map<string, boolean>()
  let offset = 0
  const MAX_EVENTS_PER_REQUEST = 1000

  // Paginate through all events
  while (true) {
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

    for (const log of logs) {
      const decodedData = autoVotingToggledEvent.decodeEventLog({
        topics: log.topics.map((topic: string) => Hex.of(topic)),
        data: Hex.of(log.data),
      })
      const walletAddress = decodedData.args.account as string
      const enabled = decodedData.args.enabled as boolean
      userStateAtSnapshot.set(walletAddress.toLowerCase(), enabled)
    }

    if (logs.length < MAX_EVENTS_PER_REQUEST) {
      break
    }
    offset += MAX_EVENTS_PER_REQUEST
  }

  // Return only users with enabled status
  return Array.from(userStateAtSnapshot.entries())
    .filter(([, isEnabled]) => isEnabled === true)
    .map(([user]) => user)
}

/**
 * Query AllocationAutoVoteCast events for a specific round with pagination
 * Returns the set of voter addresses that were auto-voted for
 */
async function getAutoVotesForRound(
  thor: ThorClient,
  contractAddress: string,
  roundId: number,
  fromBlock: number,
  toBlock: number,
): Promise<Set<string>> {
  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const autoVoteCastEvent = xAllocationVotingContract.getEvent("AllocationAutoVoteCast") as any

  // Encode roundId as topic (indexed parameter)
  const roundIdHex = "0x" + roundId.toString(16).padStart(64, "0")

  const voters = new Set<string>()
  let offset = 0
  const MAX_EVENTS_PER_REQUEST = 1000

  while (true) {
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
            topic0: autoVoteCastEvent.encodeFilterTopicsNoNull({})[0],
            topic2: roundIdHex,
          },
          eventAbi: autoVoteCastEvent,
        },
      ],
    })

    for (const log of logs) {
      const decodedData = autoVoteCastEvent.decodeEventLog({
        topics: log.topics.map((topic: string) => Hex.of(topic)),
        data: Hex.of(log.data),
      })
      const voter = decodedData.args.voter as string
      voters.add(voter.toLowerCase())
    }

    if (logs.length < MAX_EVENTS_PER_REQUEST) {
      break
    }
    offset += MAX_EVENTS_PER_REQUEST
  }

  return voters
}

/**
 * Query RelayerFeeTaken events for a specific round (cycle) with pagination
 * Returns the set of voter addresses that had their rewards claimed by the relayer
 */
async function getAutoClaimsForRound(
  thor: ThorClient,
  contractAddress: string,
  roundId: number,
  fromBlock: number,
  toBlock?: number,
): Promise<Set<string>> {
  const voterRewardsContract = ABIContract.ofAbi(VoterRewards__factory.abi)
  const relayerFeeTakenEvent = voterRewardsContract.getEvent("RelayerFeeTaken") as any

  // Encode cycle (roundId) as topic (indexed parameter)
  const cycleHex = "0x" + roundId.toString(16).padStart(64, "0")

  const voters = new Set<string>()
  let offset = 0
  const MAX_EVENTS_PER_REQUEST = 1000

  while (true) {
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
            topic0: relayerFeeTakenEvent.encodeFilterTopicsNoNull({})[0],
            topic2: cycleHex,
          },
          eventAbi: relayerFeeTakenEvent,
        },
      ],
    })

    for (const log of logs) {
      const decodedData = relayerFeeTakenEvent.decodeEventLog({
        topics: log.topics.map((topic: string) => Hex.of(topic)),
        data: Hex.of(log.data),
      })
      const voter = decodedData.args.voter as string
      voters.add(voter.toLowerCase())
    }

    if (logs.length < MAX_EVENTS_PER_REQUEST) {
      break
    }
    offset += MAX_EVENTS_PER_REQUEST
  }

  return voters
}

/**
 * Get relayer rewards status for a specific round
 */
async function getRelayerRewardsStatus(
  thor: ThorClient,
  contractAddress: string,
  roundId: number,
): Promise<{ isClaimable: boolean; totalRewards: bigint; reason: string }> {
  const relayerPoolContract = ABIContract.ofAbi(RelayerRewardsPool__factory.abi)

  // Check if rewards are claimable
  const claimableResult = await thor.contracts.executeCall(
    contractAddress,
    relayerPoolContract.getFunction("isRewardClaimable"),
    [roundId],
  )

  // Get total rewards
  const rewardsResult = await thor.contracts.executeCall(
    contractAddress,
    relayerPoolContract.getFunction("getTotalRewards"),
    [roundId],
  )

  const isClaimable = claimableResult.success ? (claimableResult.result?.array?.[0] as boolean) : false
  const rawRewards = rewardsResult.success ? rewardsResult.result?.array?.[0] : undefined
  const totalRewards = rawRewards ? BigInt(String(rawRewards)) : BigInt(0)

  let reason = ""
  if (isClaimable) {
    reason = "Yes"
  } else if (totalRewards === BigInt(0)) {
    reason = "No rewards deposited"
  } else {
    reason = "Round not complete or not ended"
  }

  return { isClaimable, totalRewards, reason }
}

/**
 * Get number of relayers for a specific round from TotalAutoVotingActionsSet event
 */
async function getNumRelayersForRound(
  thor: ThorClient,
  contractAddress: string,
  roundId: number,
  fromBlock: number,
  toBlock: number,
): Promise<number> {
  const relayerPoolContract = ABIContract.ofAbi(RelayerRewardsPool__factory.abi)
  const actionsSetEvent = relayerPoolContract.getEvent("TotalAutoVotingActionsSet") as any

  // Encode roundId as topic (indexed parameter)
  const roundIdHex = "0x" + roundId.toString(16).padStart(64, "0")

  const logs = await thor.logs.filterEventLogs({
    range: {
      unit: "block" as const,
      from: fromBlock,
      to: toBlock,
    },
    options: {
      offset: 0,
      limit: 10,
    },
    order: "asc",
    criteriaSet: [
      {
        criteria: {
          address: contractAddress,
          topic0: actionsSetEvent.encodeFilterTopicsNoNull({})[0],
          topic1: roundIdHex,
        },
        eventAbi: actionsSetEvent,
      },
    ],
  })

  if (logs.length === 0) {
    return 0
  }

  const decodedData = actionsSetEvent.decodeEventLog({
    topics: logs[0].topics.map((topic: string) => Hex.of(topic)),
    data: Hex.of(logs[0].data),
  })

  return Number(decodedData.args.numRelayers ?? 0)
}

/**
 * Get unique transaction IDs from AllocationAutoVoteCast events for a round
 */
async function getVotingTransactionIds(
  thor: ThorClient,
  contractAddress: string,
  roundId: number,
  fromBlock: number,
  toBlock: number,
): Promise<Set<string>> {
  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const autoVoteCastEvent = xAllocationVotingContract.getEvent("AllocationAutoVoteCast") as any
  const roundIdHex = "0x" + roundId.toString(16).padStart(64, "0")

  const txIds = new Set<string>()
  let offset = 0
  const MAX_EVENTS_PER_REQUEST = 1000

  while (true) {
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
            topic0: autoVoteCastEvent.encodeFilterTopicsNoNull({})[0],
            topic2: roundIdHex,
          },
          eventAbi: autoVoteCastEvent,
        },
      ],
    })

    for (const log of logs) {
      if (log.meta?.txID) {
        txIds.add(log.meta.txID)
      }
    }

    if (logs.length < MAX_EVENTS_PER_REQUEST) {
      break
    }
    offset += MAX_EVENTS_PER_REQUEST
  }

  return txIds
}

/**
 * Get unique transaction IDs from RelayerFeeTaken events for a round
 */
async function getClaimingTransactionIds(
  thor: ThorClient,
  contractAddress: string,
  roundId: number,
  fromBlock: number,
  toBlock?: number,
): Promise<Set<string>> {
  const voterRewardsContract = ABIContract.ofAbi(VoterRewards__factory.abi)
  const relayerFeeTakenEvent = voterRewardsContract.getEvent("RelayerFeeTaken") as any
  const cycleHex = "0x" + roundId.toString(16).padStart(64, "0")

  const txIds = new Set<string>()
  let offset = 0
  const MAX_EVENTS_PER_REQUEST = 1000

  while (true) {
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
            topic0: relayerFeeTakenEvent.encodeFilterTopicsNoNull({})[0],
            topic2: cycleHex,
          },
          eventAbi: relayerFeeTakenEvent,
        },
      ],
    })

    for (const log of logs) {
      if (log.meta?.txID) {
        txIds.add(log.meta.txID)
      }
    }

    if (logs.length < MAX_EVENTS_PER_REQUEST) {
      break
    }
    offset += MAX_EVENTS_PER_REQUEST
  }

  return txIds
}

/**
 * Calculate total VTHO spent from a set of transaction IDs
 * VTHO = gasUsed * (baseFee + priorityFee)
 */
async function calculateVthoSpent(thor: ThorClient, txIds: Set<string>): Promise<bigint> {
  let totalVtho = BigInt(0)

  for (const txId of txIds) {
    try {
      const receipt = await thor.transactions.getTransactionReceipt(txId)
      if (receipt) {
        // The receipt.paid field contains the actual VTHO paid
        const paid = BigInt(receipt.paid ?? 0)
        totalVtho += paid
      }
    } catch (error) {
      // Skip failed receipt fetches
      console.warn(`    Warning: Could not fetch receipt for tx ${txId}`)
    }
  }

  return totalVtho
}

// ============ Formatting Helpers ============

/**
 * Format token amount (18 decimals) to human readable string
 */
function formatTokenAmount(amountWei: bigint, symbol: string): string {
  const decimals = 18
  const divisor = BigInt(10 ** decimals)
  const integerPart = amountWei / divisor
  const fractionalPart = amountWei % divisor

  // Format with 2 decimal places
  const fractionalStr = fractionalPart.toString().padStart(decimals, "0").slice(0, 2)
  return `${integerPart}.${fractionalStr} ${symbol}`
}

function formatB3TR(amountWei: bigint): string {
  return formatTokenAmount(amountWei, "B3TR")
}

function formatVTHO(amountWei: bigint): string {
  return formatTokenAmount(amountWei, "VTHO")
}

/**
 * Analyze a single round
 */
async function analyzeRound(thor: ThorClient, roundId: number): Promise<RoundAnalytics> {
  console.log(`\n  Analyzing round ${roundId}...`)

  // Get round boundaries
  const roundSnapshot = await getRoundSnapshot(thor, CONFIG.xAllocationVotingContractAddress, roundId)
  const roundDeadline = await getRoundDeadline(thor, CONFIG.xAllocationVotingContractAddress, roundId)

  // Get auto-voting users at round start
  const autoVotingUsers = await getAllAutoVotingEnabledUsers(
    thor,
    CONFIG.xAllocationVotingContractAddress,
    0,
    roundSnapshot,
  )
  console.log(`    - Auto-voting users at snapshot: ${autoVotingUsers.length}`)

  // Get users who were voted for by relayer
  const votedForUsers = await getAutoVotesForRound(
    thor,
    CONFIG.xAllocationVotingContractAddress,
    roundId,
    roundSnapshot,
    roundDeadline,
  )
  console.log(`    - Users voted for: ${votedForUsers.size}`)

  // Get users who had rewards claimed by relayer
  // Claims happen after the round ends, so we search from deadline onwards
  const claimedUsers = await getAutoClaimsForRound(
    thor,
    CONFIG.voterRewardsContractAddress,
    roundId,
    roundDeadline,
    undefined,
  )
  console.log(`    - Users with rewards claimed: ${claimedUsers.size}`)

  // Get relayer rewards status
  const relayerStatus = await getRelayerRewardsStatus(thor, CONFIG.relayerRewardsPoolContractAddress, roundId)
  console.log(`    - Relayer rewards claimable: ${relayerStatus.reason}`)

  // Get number of relayers for this round
  const numRelayers = await getNumRelayersForRound(
    thor,
    CONFIG.relayerRewardsPoolContractAddress,
    roundId,
    roundSnapshot,
    roundDeadline,
  )
  console.log(`    - Number of relayers: ${numRelayers}`)

  // Get VTHO spent on voting transactions (voting for this round)
  const votingTxIds = await getVotingTransactionIds(
    thor,
    CONFIG.xAllocationVotingContractAddress,
    roundId,
    roundSnapshot,
    roundDeadline,
  )
  const vthoSpentOnVoting = await calculateVthoSpent(thor, votingTxIds)
  console.log(
    `    - VTHO spent on voting (round ${roundId}): ${formatVTHO(vthoSpentOnVoting)} (${votingTxIds.size} txs)`,
  )

  // Get VTHO spent on claiming transactions for PREVIOUS round
  // During round N, we claim rewards for round N-1 (since N-1 just ended)
  const prevRoundId = roundId - 1
  let vthoSpentOnClaiming = BigInt(0)
  let claimingTxCount = 0

  if (prevRoundId >= FIRST_AUTO_VOTING_ROUND) {
    const prevRoundDeadline = await getRoundDeadline(thor, CONFIG.xAllocationVotingContractAddress, prevRoundId)
    const claimingTxIds = await getClaimingTransactionIds(
      thor,
      CONFIG.voterRewardsContractAddress,
      prevRoundId, // Claims for previous round
      prevRoundDeadline,
      roundDeadline, // Limit to transactions during this round's period
    )
    vthoSpentOnClaiming = await calculateVthoSpent(thor, claimingTxIds)
    claimingTxCount = claimingTxIds.size
    console.log(
      `    - VTHO spent on claiming (round ${prevRoundId}): ${formatVTHO(vthoSpentOnClaiming)} (${claimingTxCount} txs)`,
    )
  } else {
    console.log(`    - VTHO spent on claiming: N/A (first auto-voting round)`)
  }

  const vthoSpentTotal = vthoSpentOnVoting + vthoSpentOnClaiming
  console.log(`    - Total VTHO spent this round: ${formatVTHO(vthoSpentTotal)}`)

  return {
    roundId,
    autoVotingUsersCount: autoVotingUsers.length,
    votedForCount: votedForUsers.size,
    rewardsClaimedCount: claimedUsers.size,
    relayerRewardsClaimable: relayerStatus.isClaimable,
    relayerRewardsClaimableReason: relayerStatus.reason,
    totalRelayerRewards: formatB3TR(relayerStatus.totalRewards),
    totalRelayerRewardsRaw: relayerStatus.totalRewards.toString(),
    numRelayers,
    vthoSpentOnVoting: formatVTHO(vthoSpentOnVoting),
    vthoSpentOnVotingRaw: vthoSpentOnVoting.toString(),
    vthoSpentOnClaiming: formatVTHO(vthoSpentOnClaiming),
    vthoSpentOnClaimingRaw: vthoSpentOnClaiming.toString(),
    vthoSpentTotal: formatVTHO(vthoSpentTotal),
    vthoSpentTotalRaw: vthoSpentTotal.toString(),
  }
}

/**
 * Print results as a formatted table
 */
function printTable(rounds: RoundAnalytics[]): void {
  console.log("\n")
  console.log("=".repeat(110))
  console.log("AUTO-VOTING ANALYTICS REPORT")
  console.log("=".repeat(110))

  // Header
  const header = [
    "Round".padEnd(6),
    "Users".padEnd(6),
    "Voted".padEnd(6),
    "Claimed".padEnd(8),
    "Relayers".padEnd(9),
    "VTHO Spent".padEnd(18),
    "Claimable".padEnd(12),
    "B3TR Rewards".padEnd(18),
  ].join(" | ")

  console.log(header)
  console.log("-".repeat(110))

  // Rows
  for (const round of rounds) {
    const row = [
      round.roundId.toString().padEnd(6),
      round.autoVotingUsersCount.toString().padEnd(6),
      round.votedForCount.toString().padEnd(6),
      round.rewardsClaimedCount.toString().padEnd(8),
      round.numRelayers.toString().padEnd(9),
      round.vthoSpentTotal.padEnd(18),
      (round.relayerRewardsClaimable ? "Yes" : "No").padEnd(12),
      round.totalRelayerRewards.padEnd(18),
    ].join(" | ")
    console.log(row)
  }

  console.log("=".repeat(110))
}

/**
 * Save report to JSON file
 */
function saveReport(report: AnalyticsReport): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `auto-voting-report-${timestamp}.json`
  const filepath = path.join(__dirname, "..", "output", filename)

  // Ensure output directory exists
  const outputDir = path.dirname(filepath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(filepath, JSON.stringify(report, null, 2))
  return filepath
}

// ============ Main ============

async function main(): Promise<void> {
  console.log("Auto-Voting Round Analytics")
  console.log("===========================")
  console.log(`Network: Mainnet`)
  console.log(`Starting from round: ${FIRST_AUTO_VOTING_ROUND}`)

  const thor = ThorClient.at(MAINNET_URL, { isPollingEnabled: false })

  // Get current round
  const currentRoundId = await getCurrentRoundId(thor, CONFIG.xAllocationVotingContractAddress)
  console.log(`Current round: ${currentRoundId}`)

  const rounds: RoundAnalytics[] = []

  // Analyze each round from first auto-voting round to current
  for (let roundId = FIRST_AUTO_VOTING_ROUND; roundId <= currentRoundId; roundId++) {
    try {
      const roundAnalytics = await analyzeRound(thor, roundId)
      rounds.push(roundAnalytics)
    } catch (error) {
      console.error(`  Error analyzing round ${roundId}:`, error)
      // Continue with next round
    }
  }

  // Print table
  printTable(rounds)

  // Save to JSON
  const report: AnalyticsReport = {
    generatedAt: new Date().toISOString(),
    network: "mainnet",
    firstRound: FIRST_AUTO_VOTING_ROUND,
    currentRound: currentRoundId,
    rounds,
  }

  const filepath = saveReport(report)
  console.log(`\nReport saved to: ${filepath}`)
}

main().catch(error => {
  console.error("Script failed:", error)
  process.exit(1)
})
