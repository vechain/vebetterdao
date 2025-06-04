import { useQueries } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { getHasXAppClaimed, getHasXAppClaimedQueryKey } from "./useHasXAppClaimed"

/**
 * Fetch if allocation was claimed of multiple xApps in an allocation round
 * @param roundId - The round id to get the votes for
 * @param appIds - The xApps to get the votes for
 * @returns (bool, appId)
 */
export const useHaveXAppsClaimed = (roundId: string, appIds: string[]) => {
  const thor = useThor()
  return useQueries({
    queries: appIds.map(id => ({
      queryKey: getHasXAppClaimedQueryKey(roundId, id),
      queryFn: async () => {
        return getHasXAppClaimed(thor, roundId, id)
      },
    })),
  })
}
