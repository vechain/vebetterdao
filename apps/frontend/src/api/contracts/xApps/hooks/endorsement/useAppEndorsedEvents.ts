import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useMemo } from "react"

import { getEventsKey, useEvents } from "../../../../../hooks/useEvents"

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
}) => {
  return getEventsKey({ eventName: "AppEndorsed", filterParams: filterOptions })
}

/**
 * Hook to get all AppEndorsed events from the X2EarnApps contract
 * @param filterOptions Filter options for appId, nodeId, and endorsed
 * @returns Query result with AppEndorsed events sorted by blockNumber descending
 */
export const useAppEndorsedEvents = (filterOptions?: { appId?: string; nodeId?: string; endorsed?: boolean }) => {
  const filterParams = {
    endorsed: filterOptions?.endorsed ?? undefined,
    id: filterOptions?.appId ?? undefined,
    nodeId: filterOptions?.nodeId ?? undefined,
  }

  const { data, isLoading, ...rest } = useEvents({
    contractAddress,
    abi,
    eventName: "AppEndorsed",
    filterParams,
    mapResponse: ({ decodedData, meta }) => ({
      appId: decodedData.args.id.toString(),
      nodeId: decodedData.args.nodeId.toString(),
      endorsed: decodedData.args.endorsed,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
  })

  // Sort events by blockNumber in descending order
  const sortedEvents = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => b.blockNumber - a.blockNumber)
  }, [data])

  return {
    data: sortedEvents,
    isLoading,
    ...rest,
  }
}
