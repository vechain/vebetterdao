import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import XAllocationsVotingContract from "@repo/contracts/artifacts/contracts/x-allocation-voting-governance/XAllocationVotingGovernor.sol/XAllocationVotingGovernor.json"
import { getConfig } from "@repo/config"
import { getAllocationRoundStateQueryKey } from "./useAllocationRoundState"
const xAllocationsVotingContractAbi = XAllocationsVotingContract.abi
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *
 * Returns the proposal deadline of a given proposalId
 * @param thor  the thor client
 * @param proposalId  the proposalId the get state for
 * @returns the proposal deadline of a given proposalId
 */
export const getAllocationRoundDeadline = async (thor: Connex.Thor, proposalId: string): Promise<string> => {
  const proposalDeadlineAbi = xAllocationsVotingContractAbi.find(abi => abi.name === "proposalDeadline")
  if (!proposalDeadlineAbi) throw new Error("proposalDeadline function not found")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(proposalDeadlineAbi).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAllocationRoundDeadlineQueryKey = (proposalId: string) => ["allocationRoundDeadline", proposalId]

/**
 * Hook to get the proposal deadline of a given proposalId
 * @param proposalId  the proposalId the get state for
 * @returns  the proposal deadline of a given proposalId
 */
export const useAllocationRoundVotingPeriod = (proposalId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationRoundStateQueryKey(proposalId),
    queryFn: async () => await getAllocationRoundDeadline(thor, proposalId),
    enabled: !!thor && !!proposalId,
  })
}
