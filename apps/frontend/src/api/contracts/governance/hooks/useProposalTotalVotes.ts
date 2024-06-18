import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { ethers } from "ethers"

const contractAddress = getConfig().b3trGovernorAddress
const contractInterface = B3TRGovernor__factory.createInterface()

/**
 * Get the operationId of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the operationId of the given proposal
 */
export const getProposalTotalVotesQueryKey = (proposalId: string) => {
  getCallKey({ method: "proposalTotalVotes", keyArgs: [proposalId] })
}

/**
 *  Hook to get the operationId of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the operationId of the given proposal
 */
export const useProposalTotalVotes = (proposalId?: string) => {
  return useCall({
    contractInterface,
    contractAddress,
    method: "proposalTotalVotes",
    args: [proposalId],
    enabled: !!proposalId,
    mapResponse: res => ethers.formatEther(res),
  })
}
