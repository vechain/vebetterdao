import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"

const B3TRGOVERNOR_CONTRACT = getConfig().b3trGovernorAddress

/**
 * Check if quadratic voting is disabled for the current round
 *
 * @param thor The ThorClient instance used to interact with the blockchain
 * @returns A boolean indicating if quadratic voting is disabled for the current round
 */
export const getIsQuadraticVotingDisabled = async (thor: ThorClient): Promise<boolean> => {
  const res = await thor.contracts
    .load(B3TRGOVERNOR_CONTRACT, B3TRGovernor__factory.abi)
    .read.isQuadraticVotingDisabledForCurrentRound()

  if (!res) return Promise.reject(new Error("Quadratic voting disabled call failed"))

  return res[0] as boolean
}

/**
 * Generates a query key for checking if quadratic voting is disabled
 *
 * @returns An array representing the query key
 */
export const getIsQuadraticVotingDisabledQueryKey = () => ["quadraticVotingDisabled"]

/**
 * Custom hook to check if quadratic voting is disabled for the current round
 *
 * @returns A react-query object containing the query status and result
 */
export const useIsQuadraticVotingDisabled = () => {
  const thor = useThor()
  return useQuery({
    queryKey: getIsQuadraticVotingDisabledQueryKey(),
    queryFn: async () => await getIsQuadraticVotingDisabled(thor),
    enabled: !!thor,
  })
}
