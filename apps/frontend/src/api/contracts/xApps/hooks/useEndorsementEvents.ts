import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getEndorsementEvent } from "../getEndorsementEvents"

export const getEndorsementEventsQueryKey = (appId = "all") => ["proposalsEvents", appId]

/**
 *  Hook to get the endorsement events from the X2Earn contract (i.e the time the Endorsement was made for the appId)
 * @returns  the proposals events
 */
export const useEndorsementEvents = (appId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getEndorsementEventsQueryKey(appId),
    queryFn: async () => await getEndorsementEvent(thor, appId),
    enabled: !!thor,
  })
}
