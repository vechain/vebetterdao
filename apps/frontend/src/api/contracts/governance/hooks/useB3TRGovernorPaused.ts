import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@repo/contracts"
const b3trAbi = B3TRGovernorJson.abi

const config = getConfig()
const B3TR_CONTRACT = config.b3trGovernorAddress

/**
 * getIsB3TRGovernorPaused is an asynchronous function that checks if the B3TRGovernor contract is paused.
 *
 * @param {Connex.Thor} thor - The Connex.Thor instance to interact with the VeChain Thor blockchain.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the B3TRGovernor contract is paused.
 * @throws Will throw an error if the function ABI is not found or if there is a VM error.
 */
export const getIsB3TRGovernorPaused = async (thor: Connex.Thor): Promise<boolean> => {
  const functionAbi = b3trAbi.find(e => e.name === "paused")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for delegates"))
  const res = await thor.account(B3TR_CONTRACT).method(functionAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return Boolean(res.decoded[0])
}

/**
 * getIsB3TRGovernorPausedQueryKey is a function that returns the query key for the getIsB3TRGovernorPaused query.
 *
 * @returns {string[]} An array of strings representing the query key.
 */
export const getIsB3TRGovernorPausedQueryKey = () => ["B3TRGovernor", "paused"]

/**
 * useB3TRGovernorPaused is a custom hook that uses the useQuery hook from react-query to fetch the paused status of the B3TRGovernor contract.
 *
 * @returns {UseQueryResult} The result object from the useQuery hook. Refer to the react-query documentation for more details.
 */
export const useB3TRGovernorPaused = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsB3TRGovernorPausedQueryKey(),
    queryFn: () => getIsB3TRGovernorPaused(thor),
  })
}
