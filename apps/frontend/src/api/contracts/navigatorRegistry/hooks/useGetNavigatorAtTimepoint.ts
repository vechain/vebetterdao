import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().navigatorRegistryContractAddress as `0x${string}`
const abi = NavigatorRegistry__factory.abi
const method = "getNavigatorAtTimepoint" as const

export const getNavigatorAtTimepointQueryKey = (citizen: string, timepoint: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [citizen as `0x${string}`, BigInt(timepoint)] })

/**
 * Returns the navigator a citizen was delegated to at a past block.
 * Returns address(0) if the navigator was already deactivated/exited at that timepoint
 * (i.e. the delegation had no voting effect for that round).
 *
 * Use this — not `useGetRawNavigatorAtTimepoint` — to determine the user's effective
 * delegation for a given snapshot. The raw variant returns stale checkpoints to dead
 * navigators, which misrepresents the actual voting state.
 */
export const useGetNavigatorAtTimepoint = (citizen?: string, timepoint?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [(citizen ?? "") as `0x${string}`, BigInt(timepoint ?? "0")],
    queryOptions: {
      enabled: !!citizen && !!timepoint && !!address,
      select: data => (data?.[0] as string) ?? "",
    },
  })
}
