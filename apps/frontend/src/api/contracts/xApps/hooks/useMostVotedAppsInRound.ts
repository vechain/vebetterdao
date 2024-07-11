import { useRoundXApps } from "./useRoundXApps"
import { useXAppsVotesQf } from "./useXAppsVotesQf"
import { XApp, useXApps } from "./useXApps"
import { useQuery } from "@tanstack/react-query"

type MostVotedAppsInRoundReturnType = {
  votes: string
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

  const xAppsVotes = useXAppsVotesQf(apps?.map(app => app.id) ?? [], roundId)
  const queriesLoading = xAppsVotes.some(query => query.isLoading)

  return useQuery({
    queryKey: getMostVotedAppsInRoundQueryKey(roundId),
    queryFn: async (): Promise<MostVotedAppsInRoundReturnType[]> => {
      return xAppsVotes
        .map(app => ({
          votes: app.data?.votes ?? "0",
          id: apps?.find(xa => xa.id === app.data?.app)?.id ?? "",
          app: apps?.find(xa => xa.id === app.data?.app) ?? ({} as XApp),
        }))
        .sort((a, b) => Number(b.votes) - Number(a.votes))
    },
    enabled: !queriesLoading && !!roundId && !!apps && !!xAppsVotes,
  })
}
