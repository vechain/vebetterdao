import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
const b3trGovernorInterface = B3TRGovernor__factory.createInterface()

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

export const ProposalState = {
  0: "Pending",
  1: "Active",
  2: "Canceled",
  3: "Defeated",
  4: "Succeeded",
  5: "Queued",
  6: "Expired",
  7: "Executed",
  8: "DepositNotMet"
}

export const getProposalState = async (thor: Connex.Thor, proposalId: string): Promise<keyof typeof ProposalState> => {
  const functionFragment = b3trGovernorInterface.getFunction("state")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(functionFragment).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return Number(res.decoded[0]) as keyof typeof ProposalState
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
