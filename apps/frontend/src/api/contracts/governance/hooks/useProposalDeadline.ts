import { useQuery } from "@tanstack/react-query"
import { useThor, useCurrentBlock } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

/**
 * Get the voteEnd block of the given proposal
 * @param thor - The thor client
 * @param proposalId - The id of the proposal
 * @returns The voteEnd block of the given proposal
 */
export const getProposalDeadline = async (thor: ThorClient, proposalId: string): Promise<string | number> => {
  const res = await thor.contracts
    .load(GOVERNANCE_CONTRACT, B3TRGovernor__factory.abi)
    .read.proposalDeadline(proposalId)

  if (!res) return Promise.reject(new Error("Proposal deadline call failed"))

  return res[0].toString()
}

export const getProposalDeadlineQueryKey = (proposalId: string) => ["proposals", proposalId, "deadline"]

/**
 * Hook to get the voteEnd block of the given proposal
 * @param proposalId - The id of the proposal
 * @returns The voteEnd block of the given proposal
 */
export const useProposalDeadline = (proposalId: string) => {
  const thor = useThor()
  const { data: currentBlock } = useCurrentBlock()

  return useQuery({
    queryKey: getProposalDeadlineQueryKey(proposalId),
    queryFn: async () => await getProposalDeadline(thor, proposalId),
    enabled: !!thor && !!currentBlock && currentBlock.number > 0,
  })
}
