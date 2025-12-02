import { getConfig } from "@repo/config"
import { UseQueryResult } from "@tanstack/react-query"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/typechain-types"

import { useEvents } from "@/hooks/useEvents"

const abi = X2EarnApps__factory.abi
const contractAddress = getConfig().x2EarnAppsContractAddress

export type AppEndorsedEvent = {
  appId: string
  nodeId: string
  endorsed: boolean
  blockNumber: number
  txOrigin: string
}

export const getAppEndorsedEventsQueryKey = (filterOptions?: {
  appId?: string
  nodeId?: string
  endorsed?: boolean
}) => ["AppEndorsedEvents", Object.values(filterOptions ?? {})]

export const useAppEndorsedEvents = (filterOptions?: {
  appId?: string
  nodeId?: string
  endorsed?: boolean
}): UseQueryResult<AppEndorsedEvent[]> =>
  useEvents({
    abi,
    contractAddress,
    eventName: "AppEndorsed",
    filterParams: filterOptions?.appId ? { id: filterOptions.appId as `0x${string}` } : undefined,
    select: events =>
      events
        .map(({ meta, decodedData }) => ({
          appId: decodedData.args.id.toString(),
          nodeId: decodedData.args.nodeId.toString(),
          endorsed: decodedData.args.endorsed,
          blockNumber: meta.blockNumber,
          txOrigin: meta.txOrigin,
        }))
        .filter(
          event =>
            (filterOptions?.nodeId ? event.nodeId === filterOptions?.nodeId : true) &&
            (filterOptions?.endorsed ? event.endorsed === filterOptions?.endorsed : true),
        ),
  })
