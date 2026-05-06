import { getConfig } from "@repo/config"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

import { ProposalType } from "@/hooks/proposals/grants/types"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = [
  {
    inputs: [
      { internalType: "uint256", name: "timepoint", type: "uint256" },
      { internalType: "enum GovernorTypes.ProposalType", name: "proposalTypeValue", type: "uint8" },
    ],
    name: "quorumNumeratorByProposalType",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const
const method = "quorumNumeratorByProposalType" as const

export const getProposalQuorumNumeratorByTypeQueryKey = (blockNumber: number, proposalType: ProposalType) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [blockNumber, proposalType] })

/**
 * @dev Gets the quorum numerator (%) for a proposal type at a specific timepoint (block number).
 * Uses the checkpoint-based overload so the value reflects governance settings at that block.
 * @param blockNumber The block number (proposal.voteStart / snapshot)
 * @param proposalType The type of proposal
 */
export const useProposalQuorumNumeratorByType = (blockNumber: number, proposalType: ProposalType) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [blockNumber, proposalType],
    queryOptions: {
      enabled: !!blockNumber,
      select: data => data[0],
    },
  })
}
