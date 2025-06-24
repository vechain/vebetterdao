import { useQuery } from "@tanstack/react-query"
import { getAllEventLogs, ThorClient, useThor } from "@vechain/vechain-kit"
import { FilterCriteria } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"
import { decodeEventLog } from "@/api"

const abi = X2EarnApps__factory.abi

export type AppEndorsedEvent = {
  appId: string
  nodeId: string
  endorsed: boolean
  blockNumber: number
  txOrigin: string
}

/**
 * Fetches all AppEndorsed events
 * @param {ThorClient} thor - The thor client
 * @param {EnvConfig} env - The environment config
 * @param {object} filterOptions - Filter options for appId, nodeId, and endorsed
 * @returns {Promise<AppEndorsedEvent[]>}
 */
export const getAppEndorsedEvents = async (
  thor: ThorClient,
  filterOptions?: { appId?: string; nodeId?: string; endorsed?: boolean },
): Promise<AppEndorsedEvent[]> => {
  const x2EarnAppsContractAddress = getConfig().x2EarnAppsContractAddress

  const eventAbi = thor.contracts.load(x2EarnAppsContractAddress, abi).getEventAbi("AppEndorsed")

  const topics = eventAbi.encodeFilterTopicsNoNull({
    endorsed: filterOptions?.endorsed ?? undefined,
    id: filterOptions?.appId ?? undefined,
    nodeId: filterOptions?.nodeId ?? undefined,
  })

  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: x2EarnAppsContractAddress,
        topic0: topics[0] ?? undefined,
        topic1: topics[1] ?? undefined,
        topic2: topics[2] ?? undefined,
        topic3: topics[3] ?? undefined,
        topic4: topics[4] ?? undefined,
      },
      eventAbi,
    },
  ]

  const events = (
    await getAllEventLogs({
      nodeUrl: getConfig().nodeUrl,
      thor,
      filterCriteria,
    })
  ).map(event => decodeEventLog(event, abi))

  return events
    .map(({ decodedData, meta }) => {
      if (decodedData.eventName !== "AppEndorsed") throw new Error(`Unknown event: ${decodedData.eventName}`)

      const { id: appId, nodeId, endorsed } = decodedData.args

      return {
        appId: appId.toString(),
        nodeId: nodeId.toString(),
        endorsed,
        blockNumber: meta.blockNumber,
        txOrigin: meta.txOrigin,
      }
    })
    .filter(event => {
      if (filterOptions?.appId) {
        return event.appId === filterOptions.appId
      }
      if (filterOptions?.nodeId) {
        return event.nodeId === filterOptions.nodeId
      }
      if (filterOptions?.endorsed !== undefined) {
        return event.endorsed === filterOptions.endorsed
      }
      return true
    })
}

export const getAppEndorsedEventsQueryKey = (filterOptions?: {
  appId?: string
  nodeId?: string
  endorsed?: boolean
}) => ["AppEndorsedEvents", Object.values(filterOptions ?? {})]

/**
 * Hook to get all AppEndorsed events from the X2EarnApps contract
 * @param {object} filterOptions - Filter options for appId, nodeId, and endorsed
 * @returns {UseQueryResult<AppEndorsedEvent[], Error>}
 */
export const useAppEndorsedEvents = (filterOptions?: { appId?: string; nodeId?: string; endorsed?: boolean }) => {
  const thor = useThor()

  const result = useQuery({
    queryKey: getAppEndorsedEventsQueryKey(filterOptions),
    enabled: !!thor,
    queryFn: async () => {
      return getAppEndorsedEvents(thor, filterOptions)
    },
  })

  // sort events by blockNumber in descending order
  const sortedEvents = result.data?.sort((a, b) => b.blockNumber - a.blockNumber)

  return { ...result, data: sortedEvents }
}
