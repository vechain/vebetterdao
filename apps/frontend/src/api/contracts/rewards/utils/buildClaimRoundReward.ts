import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { EnhancedClause } from "@vechain/vechain-kit"

const voterRewardsInterface = VoterRewards__factory.createInterface()
/**
 * Builds a transaction clause to claim rewards for a specific voting round.
 * This function constructs a transaction object that can be used to interact with the VoterRewards smart contract.
 *
 * @param {string} roundId - The ID of the voting round for which the rewards are to be claimed.
 * @param {string} address - The Vechain address of the user claiming the rewards.
 * @returns {EnhancedClause} A transaction clause containing the necessary data for claiming the rewards, including the target contract address, the method call data, and the ABI for decoding.
 */
export const buildClaimRoundReward = (roundId: string, address: string): EnhancedClause => {
  const clause: EnhancedClause = {
    to: getConfig().voterRewardsContractAddress,
    value: 0,
    data: voterRewardsInterface.encodeFunctionData("claimReward", [roundId, address]),
    comment: `Claim rewards for round ${roundId}`,
    abi: JSON.parse(JSON.stringify(voterRewardsInterface.getFunction("claimReward"))),
  }
  return clause
}
