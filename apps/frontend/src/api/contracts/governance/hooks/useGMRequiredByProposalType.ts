import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"

import { ProposalType } from "@/types"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi
const method = "getRequiredGMLevelByProposalType" as const

/**
 * Returns the query key for fetching the GM level required by proposal type
 * @param proposalType - The type of proposal to get the GM required for. If not provided, the standard proposal GM required is returned.
 * @returns the query key for fetching the GM level required by proposal type
 */
export const getGMRequiredByProposalTypeQueryKey = (proposalType: ProposalType) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [proposalType] })

/**
 * Hook to get the GM level required by proposal type
 * @param proposalType - The type of proposal to get the GM required for. If not provided, the standard proposal GM required is returned.
 * @returns the GM level required for the proposal type
 */
export const useGMRequiredByProposalType = (proposalType: ProposalType = ProposalType.STANDARD) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [proposalType],
    queryOptions: {
      select: data => Number(data[0]),
    },
  })
}
