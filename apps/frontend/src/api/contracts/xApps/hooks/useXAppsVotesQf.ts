import { useQueries } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getXAppVotesQf, getXAppVotesQfQueryKey } from "./useXAppVotesQf"

/**
 * Fetch the votes of multiple xApps in an allocation round
 * @param apps  the xApps to get the votes for
 * @param roundId  the round id to get the votes for
 * @returns  the number of votes for the xApps in the tound
 */
export const useXAppsVotesQf = (apps: string[], roundId: string) => {
  const { thor } = useConnex()
  return useQueries({
    queries: apps.map(app => ({
      queryKey: getXAppVotesQfQueryKey(roundId, app),
      queryFn: async () => {
        const votes = await getXAppVotesQf(thor, roundId, app)
        return { votes, app }
      },
    })),
  })
}
