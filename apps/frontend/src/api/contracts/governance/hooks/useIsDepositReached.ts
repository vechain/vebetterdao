import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useThor, useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`
const method = "proposalDepositReached" as const
/**
 * Generates the query key for the 'getIsDepositReached' function.
 * @param proposalId - The ID of the proposal.
 * @returns An array representing the query key.
 */
export const getIsDepositReachedQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
  })
/**
 * Custom hook for retrieving the deposit reached status for a proposal.
 * @param proposalId - The ID of the proposal.
 * @returns The result of the query.
 */
export const useIsDepositReached = (proposalId: string) => {
  const thor = useThor()
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!thor && !!proposalId,
      select: res => res[0],
    },
  })
}
