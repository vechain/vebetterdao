export type VoteStrategy = "random" | "fixed"

export type SeedStrategyName = "random" | "fixed" | "linear"

export interface SimulationConfig {
  // Rounds
  numRounds: number

  // Accounts
  numAccounts: number
  accountOffset: number
  seedStrategy: SeedStrategyName

  // Voting
  ignoreVoteErrors: boolean
  chunkSize: number
  voteStrategy: VoteStrategy
  // When voteStrategy is "fixed", these percentages define vote distribution
  // for the first N apps. Must sum to 100. Remaining apps get 0%.
  // Example: [40, 30, 20, 10] -> 40% to app[0], 30% to app[1], ...
  votePercentages: number[]

  // Rewards
  claimRewards: boolean
  convertRewardsToVot3: boolean
}

const config: SimulationConfig = {
  numRounds: 10,
  numAccounts: 20,
  accountOffset: 100,
  seedStrategy: "random",

  ignoreVoteErrors: true,
  chunkSize: 20,
  voteStrategy: "fixed",
  votePercentages: [40, 30, 10, 10, 10],

  claimRewards: true,
  convertRewardsToVot3: true,
}

export default config
