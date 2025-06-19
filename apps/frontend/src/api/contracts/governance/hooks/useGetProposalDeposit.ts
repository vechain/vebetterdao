// REMOVE THIS FILE, it is not used anywhere
import { useCallClause, getCallClauseQueryKey, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "getProposalDeposits" as const

/**
 * Generates the query key for retrieving proposal deposits.
 * @param proposalId - The ID of the proposal.
 * @returns The query key as an array.
 */
export const getProposalDepositQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })

/**
 * Custom hook for fetching proposal deposits.
 * @param proposalId - The ID of the proposal.
 * @returns The result of the query with the proposal deposit as a string.
 */
export const useProposalDeposits = (proposalId: string) => {
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
