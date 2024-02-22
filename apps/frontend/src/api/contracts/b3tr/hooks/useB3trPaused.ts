import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3trContractJson } from "@repo/contracts"
const b3trAbi = B3trContractJson.abi

const config = getConfig()
const B3TR_CONTRACT = config.b3trContractAddress

/**
 * getIsB3trPaused is an asynchronous function that checks if the B3tr contract is paused.
 *
 * @param {Connex.Thor} thor - The Connex.Thor instance to interact with the VeChain Thor blockchain.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the B3tr contract is paused.
 * @throws Will throw an error if the function ABI is not found or if there is a VM error.
 */
export const getIsB3trPaused = async (thor: Connex.Thor): Promise<boolean> => {
  const functionAbi = b3trAbi.find(e => e.name === "paused")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for delegates"))
  const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return Boolean(res.decoded[0])
}

/**
 * getIsB3trPausedQueryKey is a function that returns the query key for the getIsB3trPaused query.
 *
 * @returns {string[]} An array of strings representing the query key.
 */
export const getIsB3trPausedQueryKey = () => ["b3tr", "paused"]

/**
 * useB3trPaused is a custom hook that uses the useQuery hook from react-query to fetch the paused status of the B3tr contract.
 *
 * @param {string} [address] - An optional string representing the address of the account.
 * @returns {UseQueryResult} The result object from the useQuery hook. Refer to the react-query documentation for more details.
 */
export const useB3trPaused = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsB3trPausedQueryKey(),
    queryFn: () => getIsB3trPaused(thor),
  })
}
