import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { Vot3ContractJson } from "@repo/contracts"

const vot3Abi = Vot3ContractJson.abi

const config = getConfig()

const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * getIsVot3Paused is an asynchronous function that checks if the Vot3 contract is paused.
 *
 * @param {Connex.Thor} thor - The Connex.Thor instance to interact with the VeChain Thor blockchain.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the Vot3 contract is paused.
 * @throws Will throw an error if the function ABI is not found or if there is a VM error.
 */
export const getIsVot3Paused = async (thor: Connex.Thor): Promise<boolean> => {
  const functionAbi = vot3Abi.find(e => e.name === "paused")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for delegates"))
  const res = await thor.account(VOT3_CONTRACT).method(functionAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return Boolean(res.decoded[0])
}

/**
 * getIsVot3PausedQueryKey is a function that returns the query key for the getIsVot3Paused query.
 *
 * @returns {string[]} An array of strings representing the query key.
 */
export const getIsVot3PausedQueryKey = () => ["vot3", "paused"]

/**
 * useVot3Paused is a custom hook that uses the useQuery hook from react-query to fetch the paused status of the Vot3 contract.
 *
 * @returns {UseQueryResult} The result object from the useQuery hook. Refer to the react-query documentation for more details.
 */
export const useVot3Paused = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsVot3PausedQueryKey(),
    queryFn: () => getIsVot3Paused(thor),
  })
}
