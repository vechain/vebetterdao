import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3trBadgeContractJson } from "@repo/contracts"
const b3trBadgeAbi = B3trBadgeContractJson.abi

const config = getConfig()
const B3TR_BADGE_CONTRACT = config.nftBadgeContractAddress

/**
 * getIsB3trBadgePaused is an asynchronous function that checks if the B3trBadge contract is paused.
 *
 * @param {Connex.Thor} thor - The Connex.Thor instance to interact with the VeChain Thor blockchain.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the B3trBadge contract is paused.
 * @throws Will throw an error if the function ABI is not found or if there is a VM error.
 */
export const getIsB3trBadgePaused = async (thor: Connex.Thor): Promise<boolean> => {
  const functionAbi = b3trBadgeAbi.find(e => e.name === "paused")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for delegates"))
  const res = await thor.account(B3TR_BADGE_CONTRACT).method(functionAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return Boolean(res.decoded[0])
}

/**
 * getIsB3trBadgePausedQueryKey is a function that returns the query key for the getIsB3trBadgePaused query.
 *
 * @returns {string[]} An array of strings representing the query key.
 */
export const getIsB3trBadgePausedQueryKey = () => ["b3trBadge", "paused"]

/**
 * useB3trBadgePaused is a custom hook that uses the useQuery hook from react-query to fetch the paused status of the B3trBadge contract.
 *
 * @returns {UseQueryResult} The result object from the useQuery hook. Refer to the react-query documentation for more details.
 */
export const useB3trBadgePaused = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsB3trBadgePausedQueryKey(),
    queryFn: () => getIsB3trBadgePaused(thor),
  })
}
