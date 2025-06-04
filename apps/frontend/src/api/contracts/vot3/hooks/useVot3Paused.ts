import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { VOT3__factory } from "@repo/contracts/typechain-types"
import { EnvConfig } from "@repo/config/contracts"

/**
 * getIsVot3Paused is an asynchronous function that checks if the Vot3 contract is paused.
 *
 * @param thor - The ThorClient instance to interact with the VeChain Thor blockchain.
 * @param env - The environment config
 * @returns A promise that resolves to a boolean indicating if the Vot3 contract is paused.
 */
export const getIsVot3Paused = async (thor: ThorClient, env: EnvConfig): Promise<boolean> => {
  const vot3ContractAddress = getConfig(env).vot3ContractAddress

  const res = await thor.contracts.load(vot3ContractAddress, VOT3__factory.abi).read.paused()

  if (!res) return Promise.reject(new Error("Paused call failed"))

  return Boolean(res[0])
}

/**
 * getIsVot3PausedQueryKey is a function that returns the query key for the getIsVot3Paused query.
 *
 * @returns An array of strings representing the query key.
 */
export const getIsVot3PausedQueryKey = () => ["vot3", "paused"]

/**
 * useVot3Paused is a custom hook that uses the useQuery hook from react-query to fetch the paused status of the Vot3 contract.
 *
 * @param env - The environment config
 * @returns The result object from the useQuery hook. Refer to the react-query documentation for more details.
 */
export const useVot3Paused = (env: EnvConfig) => {
  const thor = useThor()

  return useQuery({
    queryKey: getIsVot3PausedQueryKey(),
    queryFn: () => getIsVot3Paused(thor, env),
  })
}
