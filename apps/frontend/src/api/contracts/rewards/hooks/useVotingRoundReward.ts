import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts/typechain-types"
import { ethers } from "ethers"
import { RoundReward } from "../utils"
import { EnvConfig } from "@repo/config/contracts"

/**
 * Fetches the reward for a given round and voter from the VoterRewards contract.
 *
 * @param thor - The ThorClient instance to use for interacting with the VeChain Thor blockchain.
 * @param env - The environment config
 * @param address - The address of the voter.
 * @param roundId - The id of the round.
 * @returns A promise that resolves to the reward for the given round and voter.
 */
export const getRoundReward = async (
  thor: ThorClient,
  env: EnvConfig,
  address: string,
  roundId: string,
): Promise<RoundReward> => {
  const voterRewardsContractAddress = getConfig(env).voterRewardsContractAddress

  const res = await thor.contracts
    .load(voterRewardsContractAddress, VoterRewards__factory.abi)
    .read.getReward(roundId, address)

  if (!res) return Promise.reject(new Error("Get reward call failed"))

  const reward = ethers.formatEther(res[0] as bigint)

  return {
    roundId,
    rewards: reward,
  }
}

/**
 * Generates a query key for the getRoundReward query.
 *
 * @param roundId - The id of the round.
 * @param address - The address of the voter.
 * @returns An array of strings that forms the query key.
 */
export const getRoundRewardQueryKey = (roundId?: string, address?: string) => ["roundReward", roundId, "voter", address]

/**
 * useRoundReward is a custom hook that fetches the reward for a given round and voter.
 *
 * @param env - The environment config
 * @param address - The address of the voter.
 * @param roundId - The id of the round.
 * @returns An object containing the status and data of the query. Refer to the react-query documentation for more details.
 */
export const useRoundReward = (env: EnvConfig, address: string, roundId: string) => {
  const thor = useThor()
  return useQuery({
    queryKey: getRoundRewardQueryKey(roundId, address),
    queryFn: async () => await getRoundReward(thor, env, address, roundId),
    enabled: !!thor && !!address && !!roundId,
  })
}
