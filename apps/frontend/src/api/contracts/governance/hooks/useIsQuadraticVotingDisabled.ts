import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain-kit/vebetterdao-contracts"
import { getCallClauseQueryKey, useCallClause } from "@vechain/vechain-kit"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress
const method = "isQuadraticVotingDisabledForCurrentRound" as const

/**
 *  Generates a query key for checking if quadratic voting is disabled
 *
 * @returns An array representing the query key
 */
export const getIsQuadraticVotingDisabledQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 *  Custom hook to check if quadratic voting is disabled for the current round
 *
 * @returns A react-query object containing the query status and result
 */
export const useIsQuadraticVotingDisabled = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
  })
}
