import { EnhancedClause } from "@/hooks"
import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts"

const voterRewardsInterface = VoterRewards__factory.createInterface()

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
export const buildClaimRewardsTx = (roundRewards: RoundReward[], address: string): Connex.Vendor.TxMessage => {
  const clauses = []

  for (const round of roundRewards) {
    if (!round.rewards || Number(round.rewards) <= 0) continue

    const clause: EnhancedClause = {
      to: getConfig().voterRewardsContractAddress,
      value: 0,
      data: voterRewardsInterface.encodeFunctionData("claimReward", [round.roundId, address]),
      comment: `Claim rewards for round ${round.roundId}`,
      abi: JSON.parse(JSON.stringify(voterRewardsInterface.getFunction("claimReward"))),
    }

    clauses.push(clause)
  }

  return clauses
}
