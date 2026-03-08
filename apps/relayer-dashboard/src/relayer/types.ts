export interface NetworkConfig {
  name: string
  nodeUrl: string
  xAllocationVotingAddress: string
  voterRewardsAddress: string
  relayerRewardsPoolAddress: string
}

export interface RelayerSummary {
  network: string
  nodeUrl: string
  relayerAddress: string
  isRegistered: boolean
  registeredRelayers: string[]

  currentRoundId: number
  roundSnapshot: number
  roundDeadline: number
  isRoundActive: boolean
  latestBlock: number

  autoVotingUsers: number
  totalVoters: number
  totalVotes: bigint

  voteWeight: bigint
  claimWeight: bigint
  feePercentage: bigint
  feeDenominator: bigint
  feeCap: bigint
  earlyAccessBlocks: bigint

  currentTotalRewards: bigint
  currentRelayerClaimable: bigint
  currentTotalActions: bigint
  currentCompletedWeighted: bigint
  currentTotalWeighted: bigint
  currentMissedUsers: bigint
  currentRelayerActions: bigint
  currentRelayerWeighted: bigint

  previousRoundId: number
  previousTotalRewards: bigint
  previousRelayerClaimable: bigint
  previousRewardClaimable: boolean
  previousRelayerActions: bigint
}

export interface CycleResult {
  phase: "vote" | "claim"
  roundId: number
  totalUsers: number
  successful: number
  failed: { user: string; reason: string }[]
  transient: { user: string; reason: string }[]
  txIds: string[]
  dryRun: boolean
}

export type LogFn = (msg: string) => void

/** Sign and send a transaction. Returns the transaction ID. */
export type SendTransaction = (clauses: any[], gas: number) => Promise<string>
