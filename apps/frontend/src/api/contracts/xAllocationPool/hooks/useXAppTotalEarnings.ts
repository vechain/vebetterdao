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

        return await queryClient.ensureQueryData({
          queryKey: getXAppRoundEarningsQueryKey(id, appId),
          queryFn: () => getXAppRoundEarnings(thor, id, appId),
        })
      },
    })),
  })
}

export const getXAppTotalEarningsQueryKey = (appId: string, tillRoundId: string | number) => [
  "xApp",
  appId,
  "totalEarningsTillRound",
  tillRoundId,
]

/**
 *  Total earnings of multiple xApps in multiple rounds
 * @param appIds  the ids of the xApps
 * @param roundIds  the ids of the rounds
 * @returns  the total earnings of the xApps in the rounds
 */
export const useXAppsTotalEarnings = (appIds: string[], roundIds: string[]) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()
  return useQueries({
    queries: appIds.map(appId => ({
      queryKey: getXAppTotalEarningsQueryKey(appId, roundIds[roundIds.length - 1] ?? 0),
      queryFn: async () => {
        const roundsEarnings = await Promise.all(
          roundIds.map(async roundId => {
            const xAppsInRound = await queryClient.ensureQueryData({
              queryFn: () => getRoundXApps(thor, roundId),
              queryKey: getRoundXAppsQueryKey(roundId),
            })
            const isXAppInRound = xAppsInRound.some(app => app.id === appId)
            if (!isXAppInRound) return { amount: "0", appId }

            return await queryClient.ensureQueryData({
              queryKey: getXAppRoundEarningsQueryKey(roundId, appId),
              queryFn: () => getXAppRoundEarnings(thor, roundId, appId),
            })
          }),
        )
        const total = roundsEarnings.reduce((acc, { amount }) => acc + Number(amount), 0)
        return { amount: total, appId }
      },
    })),
  })
}
