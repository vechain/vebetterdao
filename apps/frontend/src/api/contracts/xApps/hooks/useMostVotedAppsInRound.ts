import { useRoundXApps } from "./useRoundXApps"
import { useXApps } from "./useXApps"
import { useQuery } from "@tanstack/react-query"
import { XApp } from "../getXApps"
import { useXAppsShares } from "./useXAppsShares"

type MostVotedAppsInRoundReturnType = {
  percentage: number
  id: string
  app: XApp
}

export const getMostVotedAppsInRoundQueryKey = (roundId: string) => ["MOST_VOTED_APPS_IN_ROUND", roundId]

/**
 * Get the most voted apps in a round
 *
 * @param roundId the id of the round to get the most voted apps
 * @returns a sorted array of the most voted apps in the round
 */
export const useMostVotedAppsInRound = (roundId: string) => {
  const { data: roundXApps } = useRoundXApps(roundId ?? "")

  // Notice: this trick is used because when starting the project in the local environment,
  // the roundId is "0" and the roundXApps is undefined, which will cause the app to not render apps info.
  const { data: allXApps } = useXApps()
  const apps = roundId === "0" ? allXApps : roundXApps

  const xAppsShares = useXAppsShares(apps?.map(app => app.id) ?? [], roundId)

  return useQuery({
    queryKey: getMostVotedAppsInRoundQueryKey(roundId),
    queryFn: async (): Promise<MostVotedAppsInRoundReturnType[]> => {
      if (!xAppsShares.data || !apps) return []
      return xAppsShares.data
        .map(appShares => ({
          percentage: appShares.share + appShares.unallocatedShare,
          id: apps?.find(xa => xa.id === appShares.app)?.id ?? "",
          app: apps?.find(xa => xa.id === appShares.app) ?? ({} as XApp),
        }))
        .sort((a, b) => Number(b.percentage) - Number(a.percentage))
    },
    enabled: xAppsShares.data && !!roundId && !!apps,
  })
}
