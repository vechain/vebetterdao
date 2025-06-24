import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "state" as const

export enum ProposalState {
  Pending, // when the round is before the vote round and the community can support
  Active, // it's the round and the community already supported the proposal, you can vote
  Canceled, // canceled by the admin dao or the user but before it becomes active
  Defeated, // didn't reached the quorum || unsuccessful votes
  Succeeded, // when the proposal has been voted for and reached the quorum
  Queued, // in queue to be executed
  Executed, // executed by the dao
  DepositNotMet, // it's the round and the community didn't supported the proposal yet
}

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
