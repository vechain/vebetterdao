import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

import { ProposalType } from "@/hooks/proposals/grants/types"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi
const method = "quorumByProposalType" as const
/**
 * Returns the query key for fetching the proposal quorum by proposal type.
 * @param blockNumber The block number to check (proposal.voteStart)
 * @param proposalType The type of proposal
 * @returns The query key for fetching the proposal quorum by proposal type.
 */
export const getProposalQuorumByTypeQueryKey = (blockNumber: number, proposalType: ProposalType) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(blockNumber), proposalType] })
/**
 * Hook to get the proposal quorum by proposal type.
 * @param blockNumber The block number to check (proposal.voteStart)
 * @param proposalType The type of proposal
 * @returns the proposal quorum by proposal type.
 */
export const useProposalQuorumByType = (blockNumber: number, proposalType: ProposalType) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(blockNumber), proposalType],
    queryOptions: {
      enabled: !!blockNumber,
      select: data => data[0],
    },
  })
}
