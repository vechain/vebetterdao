import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { VoterRewards__factory } from "@repo/contracts"

// Get the voter rewards contract address from the configuration
const VOTER_REWARDS_CONTRACT = getConfig().voterRewardsContractAddress

/**
 * Fetches the reward for a given round and voter from the VoterRewards contract.
 *
 * @param {Connex.Thor} thor - The Connex.Thor instance to use for interacting with the VeChain Thor blockchain.
 * @param {string} address - The address of the voter.
 * @param {string} roundId - The id of the round.
 * @returns {Promise<string>} A promise that resolves to the reward for the given round and voter.
 */
export const getRoundReward = async (thor: Connex.Thor, address: string, roundId: string): Promise<string> => {
  const functionFragment = VoterRewards__factory.createInterface().getFunction("getReward").format("json")

  const res = await thor.account(VOTER_REWARDS_CONTRACT).method(JSON.parse(functionFragment)).call(roundId, address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

/**
 * Generates a query key for the getRoundReward query.
 *
 * @param {string} roundId - The id of the round.
 * @param {string} address - The address of the voter.
 * @returns {Array<string>} An array of strings that forms the query key.
 */
export const getRoundRewardQueryKey = (roundId?: string, address?: string) => ["roundReward", roundId, "voter", address]

/**
 * useRoundReward is a custom hook that fetches the reward for a given round and voter.
 *
 * @param {string} address - The address of the voter.
 * @param {string} roundId - The id of the round.
 * @returns {object} An object containing the status and data of the query. Refer to the react-query documentation for more details.
 */
export const useRoundReward = (address: string, roundId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getRoundRewardQueryKey(roundId),
    queryFn: async () => await getRoundReward(thor, address, roundId),
    enabled: !!thor,
  })
}
