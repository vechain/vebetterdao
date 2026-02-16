import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"
import { executeMultipleClausesCall, ThorClient, useThor } from "@vechain/vechain-kit"

import { getXAppMetadata } from "../../getXAppMetadata"
import { isNewApp, XApp, XAppWithMetadata } from "../../getXApps"
import { useXAppsMetadataBaseUri } from "../useXAppsMetadataBaseUri"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress as `0x${string}`

export const getNodesEndorsedApps = async (thor: ThorClient, nodeIds: string[], baseURI: string) => {
  // @ts-expect-error - TypeScript has issues with deep type inference on dynamic arrays
  const endorsementsPerNode: { appId: string; points: bigint; endorsedAtRound: bigint }[][] =
    await executeMultipleClausesCall({
      thor,
      calls: nodeIds.map(
        nodeId =>
          ({
            abi,
            address,
            functionName: "getNodeActiveEndorsements",
            args: [BigInt(nodeId)],
          }) as const,
      ),
    })

  const appIdSet = new Set<string>()
  const nodeToApps: { nodeIndex: number; appId: string }[] = []

  endorsementsPerNode.forEach((endorsements, nodeIndex) => {
    const items = Array.isArray(endorsements) ? endorsements : []
    items.forEach((e: any) => {
      const appId = e.appId ?? e[0]
      if (appId && appId !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        appIdSet.add(appId)
        nodeToApps.push({ nodeIndex, appId })
      }
    })
  })

  const uniqueAppIds = Array.from(appIdSet)
  if (uniqueAppIds.length === 0) return []

  const appDetails = (
    await executeMultipleClausesCall({
      thor,
      calls: uniqueAppIds.map(
        appId =>
          ({
            abi,
            address,
            functionName: "app",
            args: [appId as `0x${string}`],
          }) as const,
      ),
    })
  ).map(app => {
    const appStringified = { ...app, createdAtTimestamp: app.createdAtTimestamp.toString() }
    return {
      ...appStringified,
      isNew: isNewApp(appStringified),
    } as XApp
  })

  const appsMetadata = await Promise.all(appDetails.map(app => getXAppMetadata(`${baseURI}${app.metadataURI}`)))

  const appMap = new Map<string, XAppWithMetadata>()
  appDetails.forEach((app, index) => {
    appMap.set(app.id, {
      ...app,
      metadata: {
        ...appsMetadata[index],
        logo: `https://api.gateway-proxy.vechain.org/ipfs/${appsMetadata[index]?.logo.replace("ipfs://", "")}`,
      },
    } as XAppWithMetadata)
  })

  return nodeToApps
    .map(({ nodeIndex, appId }) => ({
      nodeId: nodeIds[nodeIndex],
      endorsedApp: appMap.get(appId)!,
    }))
    .filter(item => !!item.endorsedApp)
}

export const getNodesEndorsedAppsQueryKey = (nodeIds: string[]) => ["XNodes", nodeIds, "ENDORSED_APPS"]

export const useNodesEndorsedApps = (nodeIds: string[]) => {
  const thor = useThor()
  const { data: baseURI } = useXAppsMetadataBaseUri()

  return useQuery({
    queryKey: getNodesEndorsedAppsQueryKey(nodeIds),
    queryFn: async () => await getNodesEndorsedApps(thor, nodeIds, baseURI ?? ""),
    enabled: !!thor && !!nodeIds?.length && !!baseURI,
  })
}
