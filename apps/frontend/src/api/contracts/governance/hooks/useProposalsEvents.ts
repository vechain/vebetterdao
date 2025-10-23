import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

import { getProposalsEvents } from "../getProposalsEvents"

export const getProposalsEventsQueryKey = (proposalId = "all") => ["proposalsEvents", proposalId]
/**
 *  Hook to get the proposals events from the governor contract (i.e the proposals created, canceled and executed)
 * @returns  the proposals events
 */
export const useProposalsEvents = (proposalId?: string) => {
  const thor = useThor()
  return useQuery({
    queryKey: getProposalsEventsQueryKey(proposalId),
    queryFn: async () => await getProposalsEvents(thor, proposalId),
    enabled: !!thor,
  })
}
