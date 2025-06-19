import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts"
import { ethers } from "ethers"

const abi = VoterRewards__factory.abi
const contractAddress = getConfig().voterRewardsContractAddress
const method = "getReward" as const

/**
 * Generates a query key for the getRoundReward query.
 *
 * @param {string} roundId - The id of the round.
 * @param {string} address - The address of the voter.
 * @returns {Array<string>} An array of strings that forms the query key.
 */
export const getRoundRewardQueryKey = (roundId: string, address: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress,
    method,
    args: [BigInt(roundId), address as `0x${string}`],
  })

/**
 * useRoundReward is a custom hook that fetches the reward for a given round and voter.
 *
 * @param {string} address - The address of the voter.
 * @param {string} roundId - The id of the round.
 * @returns {object} An object containing the status and data of the query. Refer to the react-query documentation for more details.
 */
export const useRoundReward = (address: string, roundId: string) => {
  return useCallClause({
    address: contractAddress,
    abi,
    method,
    args: [BigInt(roundId), address as `0x${string}`],
    queryOptions: {
      enabled: !!address && !!roundId,
      select: data => {
        const reward = ethers.formatEther(data[0])
        return {
          roundId,
          rewards: reward,
        }
      },
    },
  })
}
