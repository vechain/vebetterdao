import { useQueries } from "@tanstack/react-query"
import { getXAppVotes, getXAppVotesQueryKey } from "./useXAppVotes"
import { useConnex } from "@vechain/dapp-kit-react"

/**
 * Fetch the votes of multiple xApps in a proposal (allocation round)
 * @param apps  the xApps to get the votes for
 * @param proposalId  the proposal id to get the votes for
 * @returns  the number of votes for the xApps in the proposal
 */
export const useXAppsVotes = (apps: string[], proposalId: string) => {
  const { thor } = useConnex()
  return useQueries({
    queries: apps.map(app => ({
      queryKey: getXAppVotesQueryKey(app, proposalId),
      queryFn: async () => {
        const votes = await getXAppVotes(thor, app, proposalId)
        return { votes, app }
      },
    })),
  })
}
