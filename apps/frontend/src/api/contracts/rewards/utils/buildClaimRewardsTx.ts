import { getConfig } from "@repo/config"
import { EmissionsContractJson, VoterRewardsContractJson } from "@repo/contracts"

const voterRewardsAbi = VoterRewardsContractJson.abi

const emissionsAbi = EmissionsContractJson.abi

const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress

const EMISSIONS_CONTRACT = getConfig().emissionsContractAddress

/**
 * Interface for the reward for a round.
 */
export interface RoundReward {
  roundId: string
  rewards: string
}

/**
 * Checks if a cycle has ended for a given round.
 * 
 * @param {Connex.Thor} thor - The Connex.Thor instance to use for interacting with the VeChain Thor blockchain.
 * @param {string} roundId - The id of the round.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the cycle has ended.
 */
export const isCycleEnded = async (thor: Connex.Thor, roundId: string): Promise<boolean> => {
  const isCycledEndedFragment = emissionsAbi.find(abi => abi.name === "isCycleEnded")

  if (!isCycledEndedFragment) throw new Error("state function not found")

  const res = await thor.account(EMISSIONS_CONTRACT).method(isCycledEndedFragment).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
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
  const functionAbi = voterRewardsAbi.find(e => e.name === "claimReward")

  if (!functionAbi) throw new Error("Function abi not found for claimRewards")

  const clauses = []

  for (const round of roundRewards) {
    if (!round.rewards || Number(round.rewards) <= 0) continue

    const clause = thor.account(VOTER_REWARDS_CONTRACT).method(functionAbi).asClause(round.roundId, address)
    clauses.push({ ...clause, comment: `Claim rewards for round ${round.roundId}`, abi: functionAbi })
  }

  return clauses
}
