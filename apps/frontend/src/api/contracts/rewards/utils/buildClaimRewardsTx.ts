import { EnhancedClause } from "@/hooks"
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
 * @param {Connex.Thor} thor - The Connex.Thor instance to use for interacting with the VeChain Thor blockchain.
 * @param {RoundReward[]} roundRewards - An array of RoundReward objects representing the rewards for each round.
 * @param {string} address - The address of the voter.
 * @returns {Connex.Vendor.TxMessage} A Connex.Vendor.TxMessage object representing the transaction.
 */
export const buildClaimRewardsTx = (
  thor: Connex.Thor,
  roundRewards: RoundReward[],
  address: string,
): Connex.Vendor.TxMessage => {
  const clauses = []

  for (const round of roundRewards) {
    if (!round.rewards || Number(round.rewards) <= 0) continue

    const clause: EnhancedClause = buildClaimRoundReward(round.roundId, address)

    clauses.push(clause)
  }

  return clauses
}
