import { EnhancedClause } from "@vechain/vechain-kit"

import { buildClaimRoundReward } from "./buildClaimRoundReward"

/**
 * Interface for the reward for a round.
 */
export interface RoundReward {
  roundId: string
  rewards: string
}
/**
 * Builds a transaction to claim rewards for a given set of rounds.
 *
 * @param {RoundReward[]} roundRewards - An array of RoundReward objects representing the rewards for each round.
 * @param {string} address - The address of the voter.
 * @param {Map<string, boolean>} autoVotingActiveMap - Optional map of roundId to boolean indicating if auto-voting was active for that round. Rounds with auto-voting active will be excluded.
 * @returns {EnhancedClause[]} An array of EnhancedClause objects representing the transaction.
 */
export const buildClaimRewardsTx = (
  roundRewards: RoundReward[],
  address: string,
  autoVotingActiveMap?: Map<string, boolean>,
) => {
  const clauses = []

  for (const round of roundRewards) {
    if (!round.rewards || Number(round.rewards) <= 0) continue
    if (autoVotingActiveMap?.get(round.roundId) === true) continue
    const clause: EnhancedClause = buildClaimRoundReward(round.roundId, address)
    clauses.push(clause)
  }
  return clauses
}
