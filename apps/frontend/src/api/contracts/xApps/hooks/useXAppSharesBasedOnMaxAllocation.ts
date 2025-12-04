import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationPool__factory"
import { executeCallClause, executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress as `0x${string}`
// const method = "roundEarnings" as const
/**
 *  Returns the query key for the shares of multiple xApps in an allocation round.
 * @param roundId  the roundId the get the shares for
 */
export const getXAppsSharesBasedOnMaxAllocationQueryKey = (roundId?: number | string) => [
  "VECHAIN_KIT",
  "XApps",
  "Shares",
  "MaxAllocation",
  roundId,
]
/**
 * Fetch shares of multiple xApps in an allocation round
 * @param apps  the xApps to get the shares for
 * @param roundId  the round id to get the shares for
 * @returns  the shares (% of allocation pool) for the xApps in the round { allocated: number, unallocated: number }
 *
 */
export const useXAppsSharesBasedOnMaxAllocation = (apps: string[], roundId: string) => {
  const thor = useThor()
  return useQuery({
    queryKey: getXAppsSharesBasedOnMaxAllocationQueryKey(roundId),
    queryFn: async () => {
      const [[maxAppAllocation], appEarnings] = await Promise.all([
        executeCallClause({
          thor,
          abi,
          contractAddress: address,
          method: "getMaxAppAllocation",
          args: [BigInt(roundId)],
        }),
        executeMultipleClausesCall({
          thor,
          calls: apps.map(
            app =>
              ({
                abi,
                functionName: "roundEarnings",
                address,
                args: [roundId, app],
              }) as const,
          ),
        }),
      ])

      return new Map(
        appEarnings.map((earnings, index) => [
          apps[index],
          Math.round(Number((earnings[0] * 100n) / maxAppAllocation)),
        ]),
      )
    },
    enabled: !!roundId && !!apps.length,
  })
}
