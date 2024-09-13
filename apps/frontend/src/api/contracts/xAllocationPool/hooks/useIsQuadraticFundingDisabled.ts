import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress

/**
 *  Check if quadratic funding is disabled for the current round
 *
 * @param thor  The Connex instance used to interact with the blockchain
 * @returns A boolean indicating if quadratic funding is disabled for the current round
 */
export const getIsQuadraticFundingDisabled = async (thor: Connex.Thor): Promise<boolean> => {
  const functionFragment = XAllocationPool__factory.createInterface()
    .getFunction("isQuadraticFundingDisabledForCurrentRound")
    .format("json")
  const res = await thor.account(XALLOCATIONPOOL_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

/**
 *  Generates a query key for checking if quadratic funding is disabled
 *
 * @returns An array representing the query key
 */
export const getIsQuadraticFundingDisabledQueryKey = () => ["quadraticFundingDisabled"]

/**
 *  Custom hook to check if quadratic funding is disabled for the current round
 *
 * @returns A react-query object containing the query status and result
 */
export const useIsQuadraticFundingDisabled = () => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getIsQuadraticFundingDisabledQueryKey(),
    queryFn: async () => await getIsQuadraticFundingDisabled(thor),
    enabled: !!thor,
  })
}
