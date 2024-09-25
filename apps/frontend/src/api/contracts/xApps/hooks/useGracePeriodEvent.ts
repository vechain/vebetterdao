import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getGracePeriodEvent } from "../getGracePeriodEvents"

export const getGracePeriodQueryKey = (appId = "all") => ["gracePeriodEvents", appId]

/**
 *  Hook to get the endorsement grace period events from the X2Earn contract (i.e the Endorsement grace period end block for the appId)
 * @returns  the grace period events
 */
export const useGracePeriodEvent = (appId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getGracePeriodQueryKey(appId),
    queryFn: async () => await getGracePeriodEvent(thor, appId),
    enabled: !!thor,
  })
}
