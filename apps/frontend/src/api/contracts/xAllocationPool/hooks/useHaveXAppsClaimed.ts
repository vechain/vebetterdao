import { useQuery } from "@tanstack/react-query"
import { getConfig } from "@repo/config"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { XAllocationPool__factory } from "@vechain-kit/vebetterdao-contracts"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress as `0x${string}`

export const getHaveXAppsClaimedQueryKey = (roundId: string, appIds: string[]) => ["xAppsClaimed", roundId, , appIds]

/**
 * Fetch if allocation was claimed of multiple xApps in an allocation round
 * @param appIds  the xApps to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns (bool, appId)
 */
export const useHaveXAppsClaimed = (roundId: string, appIds: string[]) => {
  const thor = useThor()
  return useQuery({
    queryKey: getHaveXAppsClaimedQueryKey(roundId, appIds),
    queryFn: async () => {
      const res = await executeMultipleClausesCall({
        thor,
        calls: appIds.map(
          id =>
            ({
              abi,
              address,
              functionName: "claimed",
              args: [BigInt(roundId), id as `0x${string}`],
            }) as const,
        ),
      })

      return res.map((claimed, index) => ({
        claimed,
        appId: appIds[index],
      }))
    },
  })
}
