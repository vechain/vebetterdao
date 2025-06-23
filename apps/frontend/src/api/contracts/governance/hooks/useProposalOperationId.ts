import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "getTimelockId" as const

/**
 * Get the operationId of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the operationId of the given proposal
 */
export const getProposalOperationIdQueryKey = (proposalId: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })
}

/**
 *  Hook to get the operationId of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the operationId of the given proposal
 */
export const useProposalOperationId = (proposalId?: string, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId || "0")],
    queryOptions: {
      enabled: !!proposalId && enabled,
      select: data => data[0],
    },
  })
}
