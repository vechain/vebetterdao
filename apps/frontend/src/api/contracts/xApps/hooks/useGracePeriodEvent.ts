import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { getGracePeriodEvent } from "../getGracePeriodEvents"

export const getGracePeriodQueryKey = (appId = "all") => ["AppUnendorsedGracePeriodStarted", appId]

/**
 * Hook to get the endorsement grace period events from the X2Earn contract (i.e the Endorsement grace period end block for the appId)
 * @returns the grace period events
 */
export const useGracePeriodEvent = (appId?: string) => {
  const thor = useThor()

  const result = useQuery({
    queryKey: getGracePeriodQueryKey(appId),
    queryFn: async () => await getGracePeriodEvent(thor, appId),
    enabled: !!thor,
  })

  // sort events by blockNumber in descending order
  const sortedEvents = result.data?.sort((a, b) => b.blockNumber - a.blockNumber)

  return { ...result, data: sortedEvents }
}
