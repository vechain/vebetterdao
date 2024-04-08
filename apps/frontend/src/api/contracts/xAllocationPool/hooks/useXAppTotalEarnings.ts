import { useQueries, useQueryClient } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getXAppRoundEarnings, getXAppRoundEarningsQueryKey } from "./useXAppRoundEarnings"
import { getRoundXApps, getRoundXAppsQueryKey } from "../../xApps"

/**
 * Total earnings of an xApp in multiple rounds
 * 
 * @param roundIds ids of the rounds
 * @param appId id of the xApp

 * @returns (amount, appId)[] amount of $B3TR an xApp earned from an allocation round and the xApp id for each round
 */
export const useXAppTotalEarnings = (roundIds: string[], appId: string) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()
  return useQueries({
    queries: roundIds.map(id => ({
      queryKey: getXAppRoundEarningsQueryKey(id, appId),
      queryFn: async () => {
        const data = await queryClient.ensureQueryData({
          queryFn: () => getRoundXApps(thor, id),
          queryKey: getRoundXAppsQueryKey(id),
        })
        const isXAppInRound = data.some(app => app.id === appId)
        if (!isXAppInRound) return { amount: "0", appId }
        return getXAppRoundEarnings(thor, id, appId)
      },
    })),
  })
}
