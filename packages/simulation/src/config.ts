import defaultConfig, { SimulationConfig, SeedStrategyName, VoteStrategy } from "../simulation.config"

export const loadConfig = (): SimulationConfig => {
  const config = { ...defaultConfig }

  if (process.env.SIM_NUM_ROUNDS) config.numRounds = parseInt(process.env.SIM_NUM_ROUNDS)
  if (process.env.SIM_NUM_ACCOUNTS) config.numAccounts = parseInt(process.env.SIM_NUM_ACCOUNTS)
  if (process.env.SIM_ACCOUNT_OFFSET) config.accountOffset = parseInt(process.env.SIM_ACCOUNT_OFFSET)
  if (process.env.SIM_SEED_STRATEGY) config.seedStrategy = process.env.SIM_SEED_STRATEGY as SeedStrategyName
  if (process.env.SIM_IGNORE_VOTE_ERRORS) config.ignoreVoteErrors = process.env.SIM_IGNORE_VOTE_ERRORS !== "false"
  if (process.env.SIM_CHUNK_SIZE) config.chunkSize = parseInt(process.env.SIM_CHUNK_SIZE)
  if (process.env.SIM_VOTE_STRATEGY) config.voteStrategy = process.env.SIM_VOTE_STRATEGY as VoteStrategy
  if (process.env.SIM_VOTE_PERCENTAGES) {
    config.votePercentages = process.env.SIM_VOTE_PERCENTAGES.split(",").map(Number)
  }
  if (process.env.SIM_CLAIM_REWARDS) config.claimRewards = process.env.SIM_CLAIM_REWARDS !== "false"
  if (process.env.SIM_CONVERT_REWARDS) config.convertRewardsToVot3 = process.env.SIM_CONVERT_REWARDS !== "false"

  if (config.numRounds < 1) throw new Error("numRounds must be >= 1")
  if (config.numAccounts < 1) throw new Error("numAccounts must be >= 1")
  if (config.voteStrategy === "fixed") {
    const sum = config.votePercentages.reduce((a, b) => a + b, 0)
    if (sum !== 100) throw new Error(`votePercentages must sum to 100, got ${sum}`)
    if (config.votePercentages.some(p => p < 0)) throw new Error("votePercentages cannot be negative")
  }

  return config
}
