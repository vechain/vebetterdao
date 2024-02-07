import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import GovernorContract from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import { getConfig } from "@repo/config"
const governorContractAbi = GovernorContract.abi

const GOVERNANCE_CONTRACT = getConfig().governorContractAddress

export enum ProposalState {
  Pending,
  Active,
  Canceled,
  Defeated,
  Succeeded,
  Queued,
  Expired,
  Executed,
}

export const getProposalState = async (thor: Connex.Thor, proposalId: string): Promise<ProposalState> => {
  const stateAbi = governorContractAbi.find(abi => abi.name === "state")
  if (!stateAbi) throw new Error("state function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(stateAbi).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

export const getProposalStateQueryKey = (proposalId: string) => ["proposalState", proposalId]
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
