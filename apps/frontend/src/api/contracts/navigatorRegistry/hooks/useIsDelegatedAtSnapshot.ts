import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "isDelegatedAtTimepoint" as const

/**
 * Query key for whether the citizen was delegated to an active navigator at a past block.
 */
export const getIsDelegatedAtSnapshotQueryKey = (citizen: string, snapshotBlock: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [citizen as `0x${string}`, BigInt(snapshotBlock)],
  })

/**
 * Whether the citizen was navigator-delegated at the allocation/proposal voting snapshot block.
 * Use for voting UX; use {@link useIsDelegated} for current delegation (e.g. portfolio UI).
 */
function isPositiveBlock(snapshotBlock: string) {
  try {
    return BigInt(snapshotBlock) > 0n
  } catch {
    return false
  }
}

export const useIsDelegatedAtSnapshot = (citizen?: string, snapshotBlock?: string) => {
  const hasValidSnapshot = !!citizen && !!snapshotBlock && isPositiveBlock(snapshotBlock)
  const timepoint = hasValidSnapshot ? BigInt(snapshotBlock!) : 0n

  return useCallClause({
    abi,
    address,
    method,
    args: [(citizen ?? "") as `0x${string}`, timepoint],
    queryOptions: {
      enabled: hasValidSnapshot && !!address,
      select: data => (data?.[0] as boolean) ?? false,
    },
  })
}
