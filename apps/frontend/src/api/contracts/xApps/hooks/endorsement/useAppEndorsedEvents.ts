import { useQuery } from "@tanstack/react-query"
import { getAllEventLogs, ThorClient, useThor } from "@vechain/vechain-kit"
import { FilterCriteria } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"
import { EnvConfig } from "@repo/config/contracts"

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
  env: EnvConfig,
  filterOptions?: { appId?: string; nodeId?: string; endorsed?: boolean },
): Promise<AppEndorsedEvent[]> => {
  const x2EarnAppsContractAddress = getConfig(env).x2EarnAppsContractAddress

  const eventAbi = thor.contracts.load(x2EarnAppsContractAddress, X2EarnApps__factory.abi).getEventAbi("AppEndorsed")

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

  const events = await getAllEventLogs({
    nodeUrl: thor.httpClient.baseURL,
    thor,
    from: 0,
    to: undefined,
    filterCriteria,
  })

  return events
    .map(event => {
      if (!event.decodedData) {
        throw new Error("Event data not decoded")
      }

      const [appId, nodeId, endorsed] = event.decodedData as [bigint, bigint, boolean]

      return {
        appId: appId.toString(),
        nodeId: nodeId.toString(),
        endorsed,
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
      if (filterOptions?.endorsed !== undefined) {
        return event.endorsed === filterOptions.endorsed
      }
      return true
    })
}

export const getAppEndorsedEventsQueryKey = (
  env: EnvConfig,
  filterOptions?: {
    appId?: string
    nodeId?: string
    endorsed?: boolean
  },
) => ["AppEndorsedEvents", env, filterOptions]

/**
 * Hook to get all AppEndorsed events from the X2EarnApps contract
 * @param {EnvConfig} env - The environment config
 * @param {object} filterOptions - Filter options for appId, nodeId, and endorsed
 * @returns {UseQueryResult<AppEndorsedEvent[], Error>}
 */
export const useAppEndorsedEvents = (
  env: EnvConfig,
  filterOptions?: { appId?: string; nodeId?: string; endorsed?: boolean },
) => {
  const thor = useThor()

  const result = useQuery({
    queryKey: getAppEndorsedEventsQueryKey(env, filterOptions),
    enabled: !!thor,
    queryFn: async () => {
      if (!thor) throw new Error("Thor client not available")
      return getAppEndorsedEvents(thor, env, filterOptions)
    },
  })

  // sort events by blockNumber in descending order
  const sortedEvents = result.data?.sort((a, b) => b.blockNumber - a.blockNumber)

  return { ...result, data: sortedEvents }
}
