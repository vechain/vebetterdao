import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "getProposalDevInfo" as const

export type ProposalDevInfo = {
  devNickname: string
  discussionLink: string
}

/**
 * Returns the query key for fetching the V11 developer nickname + discussion link.
 */
export const getProposalDevInfoQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })

/**
 * Hook to fetch on-chain developer metadata (nickname + Discourse link)
 * registered alongside payees at markAsInDevelopmentWithPayees time.
 */
export const useProposalDevInfo = (proposalId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!proposalId,
      select: data =>
        ({
          devNickname: data[0] as string,
          discussionLink: data[1] as string,
        }) as ProposalDevInfo,
    },
  })
}
