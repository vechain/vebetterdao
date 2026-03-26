import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "getRoundAppSharesCap" as const
/**
 * Returns the query key for fetching the allocation shares cap.
 * @param roundId The round ID to get the shares cap for
 * @returns The query key for fetching the allocation shares cap.
 */
export const getAllocationSharesCapQueryKey = (roundId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(roundId)] })
/**
 * Hook to get the max percentage of shares that an xDapp can have in a given round
 * @param roundId The round ID to get the shares cap for
 * @returns the percentage of the total shares that an xDapp can have
 */
export const useAllocationSharesCap = (roundId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId)],
    queryOptions: {
      enabled: !!roundId,
      select: data => data[0],
    },
  })
}
