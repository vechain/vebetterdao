import { useQuery } from "@tanstack/react-query"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { XAllocationPool__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const address = getConfig().xAllocationPoolContractAddress
const abi = XAllocationPool__factory.abi
const functionName = "getAppShares" as const

/**
 *  Returns the query key for the shares of multiple xApps in an allocation round.
 * @param roundId  the roundId the get the shares for
 */
export const getXAppsSharesQueryKey = (roundId?: number | string) => ["xApps", "shares", roundId, "ALL"]

/**
 * Fetch shares of multiple xApps in an allocation round
 * @param apps  the xApps to get the shares for
 * @param roundId  the round id to get the shares for
 * @returns  the shares (% of allocation pool) for the xApps in the round { allocated: number, unallocated: number }
 *
 */
export const useXAppsShares = (apps: string[], roundId?: string) => {
  const thor = useThor()
  return useQuery({
    queryKey: getXAppsSharesQueryKey(roundId),
    queryFn: async () => {
      const res = await executeMultipleClausesCall({
        thor,
        calls: apps.map(
          app =>
            ({
              abi,
              functionName,
              address,
              args: [roundId, app],
            }) as const,
        ),
      })

      return res.map((r, index) => ({
        app: apps[index] as string,
        share: Number(r[0]) / 100,
        unallocatedShare: Number(r[1]) / 100,
      }))
    },
    enabled: !!roundId && !!apps.length,
  })
}
