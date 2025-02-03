import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { X2EarnRewardsPoolJson } from "@repo/contracts"

const X2EARN_REWARDS_POOL_CONTRACT = getConfig().x2EarnRewardsPoolContractAddress
const X2EarnRewardsPoolABI = X2EarnRewardsPoolJson.abi

/**
 * getIsX2EarnRewardsPaused is an asynchronous function that checks if the x2EarnRewardsPool contract is paused.
 *
 * @param {Connex.Thor} thor - The Connex.Thor instance to interact with the VeChain Thor blockchain.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the x2EarnRewardsPool contract is paused.
 * @throws Will throw an error if the function ABI is not found or if there is a VM error.
 */
export const getIsX2EarnRewardsPaused = async (thor: Connex.Thor): Promise<boolean> => {
  const functionAbi = X2EarnRewardsPoolABI.find(e => e.name === "paused")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for delegates"))
  const res = await thor.account(X2EARN_REWARDS_POOL_CONTRACT).method(functionAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return Boolean(res.decoded[0])
}

/**
 * Returns the query key for fetching the paused status of the x2EarnRewardsPool contract.
 * @param appId - The xApp id.
 */
export const getIsX2EarnRewardsPausedQueryKey = (appId: string | undefined) => ["x2EarnRewardsPool", "paused", appId]

/**
 * Custom hook to fetch the paused status of the x2Earn rewards pool contract
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns the paused status of the x2Earn rewards pool contract
 */
export const useX2EarnRewardsPaused = (appId: string | undefined) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsX2EarnRewardsPausedQueryKey(appId),
    queryFn: () => getIsX2EarnRewardsPaused(thor),
    enabled: !!thor && !!appId,
  })
}
