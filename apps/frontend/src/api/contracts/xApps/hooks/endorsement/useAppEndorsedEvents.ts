import { getConfig } from "@repo/config"
import { UseQueryResult, useQuery } from "@tanstack/react-query"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { useThor } from "@vechain/vechain-kit"

import { fetchContractEvents } from "@/api/contracts/governance/fetchContractEvents"
import { getEventsKey } from "@/hooks/useEvents"
import { useContractDeployBlock } from "@/hooks/useContractDeployBlock"

const contractAddress = getConfig().x2EarnAppsContractAddress

// V8 ABI from npm — includes AppEndorsed(bytes32 indexed appId, uint256 indexed nodeId, address endorser, uint256 points)
// and AppUnendorsed(bytes32 indexed appId, uint256 indexed nodeId, uint256 points)
const v8Abi = X2EarnApps__factory.abi

// V7 ABI (removed from npm) — AppEndorsed(bytes32 indexed id, uint256 nodeId, bool endorsed)
// Different topic0 than V8, so we need this to decode old events
const v7AppEndorsedAbi = [
  {
    type: "event",
    name: "AppEndorsed",
    inputs: [
      { name: "id", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "nodeId", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "endorsed", type: "bool", indexed: false, internalType: "bool" },
    ],
    anonymous: false,
  },
] as const

export type AppEndorsedEvent = {
  appId: string
  nodeId: string
  endorsed: boolean
  points?: string
  endorser?: string
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

      // V7: AppEndorsed(bytes32 indexed id, uint256 nodeId, bool endorsed)
      try {
        const v7Events = await fetchContractEvents({
          thor,
          abi: v7AppEndorsedAbi,
          contractAddress,
          eventName: "AppEndorsed",
          filterParams: filterOptions?.appId ? { id: filterOptions.appId as `0x${string}` } : undefined,
          from,
        })
        for (const { meta, decodedData } of v7Events) {
          const args = decodedData.args as { id: string; nodeId: bigint; endorsed: boolean }
          results.push({
            appId: args.id.toString(),
            nodeId: args.nodeId.toString(),
            endorsed: args.endorsed,
            blockNumber: meta.blockNumber,
            txOrigin: meta.txOrigin,
          })
        }
      } catch {
        // V7 events may not decode on V8-only deployments
      }

      // V8: AppEndorsed(bytes32 indexed appId, uint256 indexed nodeId, address endorser, uint256 points)
      try {
        const v8Events = await fetchContractEvents({
          thor,
          abi: v8Abi,
          contractAddress,
          eventName: "AppEndorsed",
          filterParams: filterOptions?.appId ? { appId: filterOptions.appId as `0x${string}` } : undefined,
          from,
        })
        for (const { meta, decodedData } of v8Events) {
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
      } catch {
        // V8 endorsed events may not exist on older deployments
      }

      // V8: AppUnendorsed(bytes32 indexed appId, uint256 indexed nodeId, uint256 points)
      try {
        const v8UnendorsedEvents = await fetchContractEvents({
          thor,
          abi: v8Abi,
          contractAddress,
          eventName: "AppUnendorsed",
          filterParams: filterOptions?.appId ? { appId: filterOptions.appId as `0x${string}` } : undefined,
          from,
        })
        for (const { meta, decodedData } of v8UnendorsedEvents) {
          results.push({
            appId: decodedData.args.appId.toString(),
            nodeId: decodedData.args.nodeId.toString(),
            endorsed: false,
            points: decodedData.args.points.toString(),
            blockNumber: meta.blockNumber,
            txOrigin: meta.txOrigin,
          })
        }
      } catch {
        // V8 unendorsed events may not exist on older deployments
      }

      return results
        .filter(e => (filterOptions?.nodeId ? e.nodeId === filterOptions.nodeId : true))
        .sort((a, b) => b.blockNumber - a.blockNumber)
    },
    enabled: from !== undefined,
    staleTime: 5 * 1000 * 60,
  })
}
