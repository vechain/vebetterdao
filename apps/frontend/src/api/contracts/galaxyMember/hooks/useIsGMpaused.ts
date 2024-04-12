import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { GalaxyMemberContractJson } from "@repo/contracts"

const galaxyMemberABI = GalaxyMemberContractJson.abi

const GALAXY_MEMBER_CONTRACT = getConfig().galaxyMemberContractAddress

/**
 * getIsGMpaused is an asynchronous function that checks if the GalaxyMember contract is paused.
 *
 * @param {Connex.Thor} thor - The Connex.Thor instance to interact with the VeChain Thor blockchain.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the GalaxyMember contract is paused.
 * @throws Will throw an error if the function ABI is not found or if there is a VM error.
 */
export const getIsGMpaused = async (thor: Connex.Thor): Promise<boolean> => {
  const functionAbi = galaxyMemberABI.find(e => e.name === "paused")
  if (!functionAbi) return Promise.reject(new Error("Function abi not found for delegates"))
  const res = await thor.account(GALAXY_MEMBER_CONTRACT).method(functionAbi).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return Boolean(res.decoded[0])
}

/**
 * getIsGMPausedQueryKey is a function that returns the query key for the getIsGMpaused query.
 *
 * @returns {string[]} An array of strings representing the query key.
 */
export const getIsGMPausedQueryKey = () => ["galaxyMember", "paused"]

/**
 * useIsGMpaused is a custom hook that uses the useQuery hook from react-query to fetch the paused status of the GalaxyMember contract.
 *
 * @returns {UseQueryResult} The result object from the useQuery hook. Refer to the react-query documentation for more details.
 */
export const useIsGMpaused = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsGMPausedQueryKey(),
    queryFn: () => getIsGMpaused(thor),
  })
}
