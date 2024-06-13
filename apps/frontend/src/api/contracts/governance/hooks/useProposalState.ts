import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
const b3trGovernorInterface = B3TRGovernor__factory.createInterface()

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

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

export const getProposalState = async (thor: Connex.Thor, proposalId: string): Promise<ProposalState> => {
  const functionFragment = b3trGovernorInterface.getFunction("state")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(functionFragment).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return Number(res.decoded[0]) as ProposalState
}

export const getProposalStateQueryKey = (proposalId: string) => ["proposals", proposalId, "state"]
/**
 *  Hook to get the proposal state from the governor contract
 * @param proposalId  the proposal id to get the state of
 * @returns  the proposal state
 */
export const useProposalState = (proposalId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalStateQueryKey(proposalId),
    queryFn: async () => await getProposalState(thor, proposalId),
    enabled: !!thor,
  })
}
