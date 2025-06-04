import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts/typechain-types"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress

/**
 * Check if quadratic funding is disabled for the current round
 *
 * @param thor - The ThorClient instance used to interact with the blockchain
 * @returns A boolean indicating if quadratic funding is disabled for the current round
 */
export const getIsQuadraticFundingDisabled = async (thor: ThorClient): Promise<boolean> => {
  const res = await thor.contracts
    .load(XALLOCATIONPOOL_CONTRACT, XAllocationPool__factory.abi)
    .read.isQuadraticFundingDisabledForCurrentRound()

  if (!res) return Promise.reject(new Error("Quadratic funding disabled call failed"))

  return res[0] as boolean
}

/**
 * Generates a query key for checking if quadratic funding is disabled
 *
 * @returns An array representing the query key
 */
export const getIsQuadraticFundingDisabledQueryKey = () => ["quadraticFundingDisabled"]

/**
 * Custom hook to check if quadratic funding is disabled for the current round
 *
 * @returns A react-query object containing the query status and result
 */
export const useIsQuadraticFundingDisabled = () => {
  const thor = useThor()
  return useQuery({
    queryKey: getIsQuadraticFundingDisabledQueryKey(),
    queryFn: async () => await getIsQuadraticFundingDisabled(thor),
    enabled: !!thor,
  })
}
