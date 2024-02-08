import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import XAllocationsVotingContract from "@repo/contracts/artifacts/contracts/x-allocation-voting-governance/XAllocationVotingGovernor.sol/XAllocationVotingGovernor.json"
import { getConfig } from "@repo/config"
const xAllocationsVotingContractAbi = XAllocationsVotingContract.abi
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *
 * Returns the state of a given proposalId
 * @param thor  the thor client
 * @param proposalId  the proposalId the get state for
 * @returns the state of a given proposalId
 */
export const getAllocationRoundState = async (thor: Connex.Thor, proposalId: string): Promise<string> => {
  const allocationRoundStateAbi = xAllocationsVotingContractAbi.find(abi => abi.name === "state")
  if (!allocationRoundStateAbi) throw new Error("state function not found")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(allocationRoundStateAbi).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAllocationRoundStateQueryKey = (proposalId: string) => ["allocationRoundState", proposalId]

/**
 * Hook to get the state of a given proposalId
 * @param proposalId  the proposalId the get state for
 * @returns  the state of a given proposalId
 */
export const useAllocationRoundState = (proposalId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationRoundStateQueryKey(proposalId),
    queryFn: async () => await getAllocationRoundState(thor, proposalId),
    enabled: !!thor && !!proposalId,
  })
}
