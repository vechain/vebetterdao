import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

const governorInterface = B3TRGovernor__factory.createInterface()

/**
 *  Get the voteEnd block of the given proposal
 * @param thor  the thor client
 * @param proposalId  the id of the proposal
 * @returns  the voteEnd block of the given proposal
 */
export const getProposalDeadline = async (thor: Connex.Thor, proposalId: string): Promise<string | number> => {
  const functionFragment = governorInterface.getFunction("proposalDeadline").format("json")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(JSON.parse(functionFragment)).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getProposalDeadlineQueryKey = (proposalId: string) => ["proposals", proposalId, "deadline"]

/**
 *  Hook to get the voteEnd block of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the voteEnd block of the given proposal
 */
export const useProposalDeadline = (proposalId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalDeadlineQueryKey(proposalId),
    queryFn: async () => await getProposalDeadline(thor, proposalId),
    enabled: !!thor && thor.status.head.number > 0,
  })
}
