import { getCallClauseQueryKey, useCallClause } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"

const abi = B3TRGovernor__factory.abi
const method = "canProposalStartInNextRound" as const
const address = getConfig().b3trGovernorAddress

export const getCanProposalStartInNextRoundQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 *  Hook to get if a proposal can start in the next round
 * @returns if a proposal can start in the next round
 */
export const useCanProposalStartInNextRound = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0],
    },
  })
}
