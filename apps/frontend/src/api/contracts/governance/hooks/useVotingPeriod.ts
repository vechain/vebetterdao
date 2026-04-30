import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "votingPeriod" as const
/**
 * Returns the query key for fetching the voting period from the governor contract.
 * @returns The query key for fetching the voting period.
 */
export const getVotingPeriodQueryKey = () => getCallClauseQueryKey({ abi, address, method })
/**
 * Hook to get the voting period from the governor contract (i.e the number of blocks for the voting period)
 * @returns the voting period
 */
export const useVotingPeriod = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0],
    },
  })
}
