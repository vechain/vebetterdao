import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

import { ProposalType } from "@/hooks/proposals/grants/types"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi
const method = "quorumNumeratorByProposalType" as const

export const getProposalQuorumNumeratorByTypeQueryKey = (proposalType: ProposalType) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [proposalType] })

/**
 * @dev This hook is used to get the proposal quorum numerator by proposal type, which is the percentage of votes required to pass a proposal.
 * Returns the query key for fetching the proposal quorum numerator by proposal type.
 * @param proposalType The type of proposal
 * @returns The query key for fetching the proposal quorum numerator by proposal type.
 */
export const useProposalQuorumNumeratorByType = (proposalType: ProposalType) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [proposalType],
    queryOptions: {
      enabled: !!proposalType,
      select: data => data[0],
    },
  })
}
