import { useQueries } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getHasXAppClaimed, getHasXAppClaimedQueryKey } from "./useHasXAppClaimed"

/**
 * Fetch if allocation was claimed of multiple xApps in an allocation round
 * @param appIds  the xApps to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns bool if the xApps have been claimed in the round
 */
export const useHaveXAppsClaimed = (roundId: string, appIds: string[]) => {
  const { thor } = useConnex()
  return useQueries({
    queries: appIds.map(id => ({
      queryKey: getHasXAppClaimedQueryKey(roundId, id),
      queryFn: async () => {
        const claimed = await getHasXAppClaimed(thor, roundId, id)
        return { claimed, id }
      },
    })),
  })
}
