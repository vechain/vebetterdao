import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi
const method = "proposalTotalVotes" as const

/**
 * Get the operationId of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the operationId of the given proposal
 */
export const getProposalTotalVotesQueryKey = (proposalId: string) => {
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId ?? "0")] })
}

/**
 *  Hook to get the operationId of the given proposal
 * @param proposalId  the id of the proposal
 * @returns  the operationId of the given proposal
 */
export const useProposalTotalVotes = (proposalId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId ?? "0")],
    queryOptions: {
      enabled: !!proposalId,
      select: data => formatEther(BigInt(data[0])),
    },
  })
}
