import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useThor, useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`
const method = "proposalEta" as const

export const getProposalEtaQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
  })

/**
 * The Unix timestamp (seconds) at which a queued proposal becomes executable. Returns 0n while the
 * proposal is in any state before Queued. Refetched on a tight interval so a UI countdown stays
 * accurate as the timelock delay elapses.
 */
export const useProposalEta = (proposalId: string, enabled = true) => {
  const thor = useThor()
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!thor && !!proposalId && enabled,
      select: res => Number(res[0]),
      refetchInterval: 15_000,
    },
  })
}
