import { useQueries } from "@tanstack/react-query"
import { getXAppVotes, getXAppVotesQueryKey } from "./useXAppVotes"
import { useConnex } from "@vechain/dapp-kit-react"

/**
 * Fetch the votes of multiple xApps in an allocation round
 * @param apps  the xApps to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns  the number of votes for the xApps in the tound
 */
export const useXAppsVotes = (apps: string[], roundId: string) => {
  const { thor } = useConnex()
  return useQueries({
    queries: apps.map(app => ({
      queryKey: getXAppVotesQueryKey(app, roundId),
      queryFn: async () => {
        const votes = await getXAppVotes(thor, app, roundId)
        return { votes, app }
      },
    })),
  })
}
