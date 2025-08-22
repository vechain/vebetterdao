import { useQuery } from "@tanstack/react-query"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress as `0x${string}`
const method = "getAppShares" as const

/**
 *  Returns the query key for the shares of multiple xApps in an allocation round.
 * @param roundId  the roundId the get the shares for
 */
export const getXAppsSharesQueryKey = (roundId?: number | string) => ["VECHAIN_KIT", "XApps", "Shares", roundId]

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
      const shares = await executeMultipleClausesCall({
        thor,
        calls: apps.map(
          app =>
            ({
              abi,
              functionName: method,
              address,
              args: [roundId, app],
            }) as const,
        ),
      })

      return shares.map((share, index) => {
        return {
          app: apps[index] as string,
          share: Number(share[0] || 0) / 100,
          unallocatedShare: Number(share[1] || 0) / 100,
        }
      })
    },
    enabled: !!roundId && !!apps.length,
  })
}
