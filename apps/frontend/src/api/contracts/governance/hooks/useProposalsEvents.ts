import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getProposalsEvents } from "../getProposalsEvents"

export const getProposalsEventsQueryKey = () => ["proposalsEvents"]

/**
 *  Hook to get the proposals events from the governor contract (i.e the proposals created, canceled and executed)
 * @returns  the proposals events
 */
export const useProposalsEvents = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalsEventsQueryKey(),
    queryFn: async () => await getProposalsEvents(thor),
    enabled: !!thor,
  })
}
