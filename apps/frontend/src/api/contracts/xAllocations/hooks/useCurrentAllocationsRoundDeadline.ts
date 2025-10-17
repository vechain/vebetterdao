import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "currentRoundDeadline" as const
/**
 * Returns the query key for fetching the current round deadline.
 * @returns The query key.
 */
export const getCurrentAllocationsRoundDeadlineQueryKey = () => getCallClauseQueryKey({ abi, address, method })
/**
 * Hook to get the blocknumber at which current round ends.
 * @returns The blocknumber.
 */
export const useCurrentAllocationsRoundDeadline = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => Number(data[0]),
    },
  })
}
