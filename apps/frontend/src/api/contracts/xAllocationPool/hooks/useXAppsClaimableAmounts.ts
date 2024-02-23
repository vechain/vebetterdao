import { useQueries } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getXAppClaimableAmount, getXAppClaimableAmountQueryKey } from "./useXAppClaimableAmount"

/**
 * Fetch the claimable amount of multiple xApps in an allocation round
 * @param appIds  the xApps to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns the claimable amount of the xApps in the round
 */
export const useXAppsClaimableAmounts = (roundId: string, appIds: string[]) => {
  const { thor } = useConnex()
  return useQueries({
    queries: appIds.map(id => ({
      queryKey: getXAppClaimableAmountQueryKey(roundId, id),
      queryFn: async () => {
        const amount = await getXAppClaimableAmount(thor, roundId, id)
        return { amount, id }
      },
    })),
  })
}
