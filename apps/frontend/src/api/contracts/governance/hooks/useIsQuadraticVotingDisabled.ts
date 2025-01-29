import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"

const B3TRGOVERNOR_CONTRACT = getConfig().b3trGovernorAddress

/**
 *  Check if quadratic voting is disabled for the current round
 *
 * @param thor  The Connex instance used to interact with the blockchain
 * @returns A boolean indicating if quadratic voting is disabled for the current round
 */
export const getIsQuadraticVotingDisabled = async (thor: Connex.Thor): Promise<boolean> => {
  const functionFragment = B3TRGovernor__factory.createInterface()
    .getFunction("isQuadraticVotingDisabledForCurrentRound")
    .format("json")
  const res = await thor.account(B3TRGOVERNOR_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

/**
 *  Generates a query key for checking if quadratic voting is disabled
 *
 * @returns An array representing the query key
 */
export const getIsQuadraticVotingDisabledQueryKey = () => ["quadraticVotingDisabled"]

/**
 *  Custom hook to check if quadratic voting is disabled for the current round
 *
 * @returns A react-query object containing the query status and result
 */
export const useIsQuadraticVotingDisabled = () => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getIsQuadraticVotingDisabledQueryKey(),
    queryFn: async () => await getIsQuadraticVotingDisabled(thor),
    enabled: !!thor,
  })
}
