export interface RoundAnalytics {
  roundId: number
  autoVotingUsersCount: number
  votedForCount: number
  rewardsClaimedCount: number
  totalRelayerRewards: string
  totalRelayerRewardsRaw: string
  estimatedRelayerRewards: string
  estimatedRelayerRewardsRaw: string
  numRelayers: number
  vthoSpentOnVoting: string
  vthoSpentOnVotingRaw: string
  vthoSpentOnClaiming: string
  vthoSpentOnClaimingRaw: string
  vthoSpentTotal: string
  vthoSpentTotalRaw: string
  expectedActions: number
  completedActions: number
  reducedUsersCount: number
  missedUsersCount: number
  allActionsOk: boolean
  actionStatus: string
  isRoundEnded: boolean
}

export interface AnalyticsReport {
  generatedAt: string
  network: string
  firstRound: number
  currentRound: number
  rounds: RoundAnalytics[]
}
