import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`
const method = "quorumReached" as const
export const getIsProposalQuorumReachedQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
  })
export const useIsProposalQuorumReached = (proposalId: string, enabled: boolean = false) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!proposalId && enabled,
      select: res => res[0],
    },
  })
}
