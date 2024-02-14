import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { XAllocationVotingGovernorJson } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

export const AllocationProposalState = {
  "0": "Active",
  "1": "Failed",
  "2": "Succeeded",
}
/**
 *
 * Returns the state of a given proposalId
 * @param thor  the thor client
 * @param proposalId  the proposalId the get state for
 * @returns the state of a given proposalId
 */
export const getAllocationsRoundState = async (
  thor: Connex.Thor,
  proposalId?: string,
): Promise<keyof typeof AllocationProposalState> => {
  if (!proposalId) return Promise.reject(new Error("proposalId is required"))
  const allocationRoundStateAbi = XAllocationVotingGovernorJson.abi.find(abi => abi.name === "state")
  if (!allocationRoundStateAbi) throw new Error("state function not found")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(allocationRoundStateAbi).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAllocationsRoundStateQueryKey = (proposalId?: string) => ["allocationsRoundState", proposalId]

/**
 * Hook to get the state of a given proposalId
 * @param proposalId  the proposalId the get state for
 * @returns  the state of a given proposalId
 */
export const useAllocationsRoundState = (proposalId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationsRoundStateQueryKey(proposalId),
    queryFn: async () => await getAllocationsRoundState(thor, proposalId),
    enabled: !!thor && !!proposalId,
  })
}
