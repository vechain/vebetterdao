import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"
import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

export type AppEndorsedEvent = {
  appId: string
  nodeId: string
  endorsed: boolean
  blockNumber: number
  txOrigin: string
}

/**
 * Fetches all AppEndorsed events
 * @param {Connex.Thor} thor
 * @returns {Promise<AppEndorsedEvent[]>}
 */
export const getAppEndorsedEvents = async (
  thor: Connex.Thor,
  filterOptions?: { appId?: string; nodeId?: string; endorsed?: boolean },
): Promise<AppEndorsedEvent[]> => {
  const eventFragment = X2EarnApps__factory.createInterface().getEvent("AppEndorsed").format("json")
  const appEndorsedEvent = new abi.Event(JSON.parse(eventFragment) as abi.Event.Definition)

  const topics = appEndorsedEvent.encode({
    endorsed: filterOptions?.endorsed ?? undefined,
    id: filterOptions?.appId ?? undefined,
    nodeId: filterOptions?.nodeId ?? undefined,
  })

  const filterCriteria = [
    {
      address: X2EARNAPPS_CONTRACT,
      topic0: topics[0] ?? undefined,
      topic1: topics[1] ?? undefined,
      topic2: topics[2] ?? undefined,
      topic3: topics[3] ?? undefined,
      topic4: topics[4] ?? undefined,
    },
  ]

  const events = await getAllEvents({ thor, filterCriteria })

  return events
    .map(event => {
      const decoded = appEndorsedEvent.decode(event.data, event.topics)
      return {
        appId: decoded[0],
        nodeId: decoded[1].toString(),
        endorsed: decoded[2],
        blockNumber: event.meta.blockNumber,
        txOrigin: event.meta.txOrigin,
      }
    })
    .filter(event => {
      if (filterOptions?.appId) {
        return event.appId === filterOptions.appId
      }
      if (filterOptions?.nodeId) {
        return event.nodeId === filterOptions.nodeId
      }
      if (filterOptions?.endorsed) {
        return event.endorsed === filterOptions.endorsed
      }
      return true
    })
}

export const getAppEndorsedEventsQueryKey = (filterOptions?: {
  appId?: string
  nodeId?: string
  endorsed?: boolean
}) => ["AppEndorsedEvents", filterOptions]

/**
 * Hook to get all AppEndorsed events from the X2EarnApps contract
 * @returns {UseQueryResult<AppEndorsedEvent[], Error>}
 */
export const useAppEndorsedEvents = (filterOptions?: { appId?: string; nodeId?: string; endorsed?: boolean }) => {
  const { thor } = useConnex()

  const result = useQuery({
    queryKey: getAppEndorsedEventsQueryKey(filterOptions),
    queryFn: async () => await getAppEndorsedEvents(thor, filterOptions),
    enabled: !!thor,
  })

  // sort events by blockNumber in descending order
  const sortedEvents = result.data?.sort((a, b) => b.blockNumber - a.blockNumber)

  return { ...result, data: sortedEvents }
}
