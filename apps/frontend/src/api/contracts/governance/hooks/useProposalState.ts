import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { GovernorContractJson } from "@repo/contracts"
const governorContractAbi = GovernorContractJson.abi

const GOVERNANCE_CONTRACT = getConfig().governorContractAddress

export const ProposalState = {
  0: "Pending",
  1: "Active",
  2: "Canceled",
  3: "Defeated",
  4: "Succeeded",
  5: "Queued",
  6: "Expired",
  7: "Executed",
}

export const getProposalState = async (thor: Connex.Thor, proposalId: string): Promise<keyof typeof ProposalState> => {
  const stateAbi = governorContractAbi.find(abi => abi.name === "state")
  if (!stateAbi) throw new Error("state function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(stateAbi).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return Number(res.decoded[0]) as keyof typeof ProposalState
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
