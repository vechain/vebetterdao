import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"

const contractAddress = getConfig().b3trGovernorAddress
const contractInterface = B3TRGovernor__factory.createInterface()
const method = "getTimelockId"

/**
 * Get the operationId of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the operationId of the given proposal
 */
export const getProposalOperationIdQueryKey = (proposalId: string) => {
  getCallKey({ method, keyArgs: [proposalId] })
}

/**
 *  Hook to get the operationId of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the operationId of the given proposal
 */
export const useProposalOperationId = (proposalId?: string, enabled = true) => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [proposalId],
    enabled: !!proposalId && enabled,
  })
}
