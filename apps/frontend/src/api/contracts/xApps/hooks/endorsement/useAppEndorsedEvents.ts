import { getConfig } from "@repo/config"
import { UseQueryResult, useQuery } from "@tanstack/react-query"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useThor } from "@vechain/vechain-kit"

import { fetchContractEvents } from "@/api/contracts/governance/fetchContractEvents"
import { useContractDeployBlock } from "@/hooks/useContractDeployBlock"
import { getEventsKey } from "@/hooks/useEvents"

const contractAddress = getConfig().x2EarnAppsContractAddress
const abi = X2EarnApps__factory.abi

export type AppEndorsedEvent = {
  appId: string
  nodeId: string
  endorsed: boolean
  points: string
  endorser: string
  blockNumber: number
  txOrigin: string
}

export const getAppEndorsedEventsQueryKey = (filterOptions?: { appId?: string; nodeId?: string }) => {
  return getEventsKey({ eventName: "AppEndorsedAll", filterParams: filterOptions })
}

export const useAppEndorsedEvents = (filterOptions?: {
  appId?: string
  nodeId?: string
}): UseQueryResult<AppEndorsedEvent[]> => {
  const thor = useThor()
  const { data: from } = useContractDeployBlock(contractAddress)

  return useQuery({
    queryKey: getAppEndorsedEventsQueryKey(filterOptions),
    queryFn: async () => {
      const results: AppEndorsedEvent[] = []

      // AppEndorsed(bytes32 indexed appId, uint256 indexed nodeId, address endorser, uint256 points)
      const endorsedEvents = await fetchContractEvents({
        thor,
        abi,
        contractAddress,
        eventName: "AppEndorsed",
        filterParams: filterOptions?.appId ? { appId: filterOptions.appId as `0x${string}` } : undefined,
        from,
      })
      for (const { meta, decodedData } of endorsedEvents) {
        results.push({
          appId: decodedData.args.appId.toString(),
          nodeId: decodedData.args.nodeId.toString(),
          endorsed: true,
          points: decodedData.args.points.toString(),
          endorser: decodedData.args.endorser,
          blockNumber: meta.blockNumber,
          txOrigin: meta.txOrigin,
        })
      }

      // AppUnendorsed(bytes32 indexed appId, uint256 indexed nodeId, uint256 points)
      const unendorsedEvents = await fetchContractEvents({
        thor,
        abi,
        contractAddress,
        eventName: "AppUnendorsed",
        filterParams: filterOptions?.appId ? { appId: filterOptions.appId as `0x${string}` } : undefined,
        from,
      })
      for (const { meta, decodedData } of unendorsedEvents) {
        const nodeId = decodedData.args.nodeId.toString()
        const endorser = results.find(e => e.nodeId === nodeId && e.endorser)?.endorser ?? meta.txOrigin

        results.push({
          appId: decodedData.args.appId.toString(),
          nodeId,
          endorsed: false,
          points: decodedData.args.points.toString(),
          endorser,
          blockNumber: meta.blockNumber,
          txOrigin: meta.txOrigin,
        })
      }

      return results
        .filter(e => (filterOptions?.nodeId ? e.nodeId === filterOptions.nodeId : true))
        .sort((a, b) => b.blockNumber - a.blockNumber)
    },
    enabled: from !== undefined,
    staleTime: 5 * 1000 * 60,
  })
}
