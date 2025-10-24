import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "state" as const
/**
 * Returns the query key for fetching the proposal state.
 * @param proposalId The proposal ID to get the state for
 * @returns The query key for fetching the proposal state.
 */
export const getProposalStateQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })
/**
 * Hook to get the proposal state from the governor contract
 * @param proposalId The proposal id to get the state of
 * @returns the proposal state
 */
export const useProposalState = (proposalId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!proposalId,
      select: data => data[0],
    },
  })
}
