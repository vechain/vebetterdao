import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"
import { executeMultipleClausesCall, ThorClient, useThor } from "@vechain/vechain-kit"

import { getXAppMetadata } from "../../getXAppMetadata"
import { isNewApp, XApp, XAppWithMetadata } from "../../getXApps"
import { useXAppsMetadataBaseUri } from "../useXAppsMetadataBaseUri"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress as `0x${string}`
const UNENDORSED_APP_ID = "0x0000000000000000000000000000000000000000000000000000000000000000"
export const getNodesEndorsedApps = async (thor: ThorClient, nodeIds: string[], baseURI: string) => {
  const apps = await executeMultipleClausesCall({
    thor,
    calls: nodeIds.map(
      nodeId =>
        ({
          abi,
          address,
          functionName: "nodeToEndorsedApp",
          args: [nodeId as `0x${string}`],
        } as const),
    ),
  })
  if (apps.length !== nodeIds.length) throw new Error("Error fetching endorsed apps")
  const appToNodeIndexMap = apps.reduce((acc, app, index) => {
    if (app !== UNENDORSED_APP_ID) acc[app] = index
    return acc
  }, {} as Record<`0x${string}`, number>)
  const appDetails = (
    await executeMultipleClausesCall({
      thor,
      calls: Object.keys(appToNodeIndexMap).map(
        appId =>
          ({
            abi,
            address,
            functionName: "app",
            args: [appId as `0x${string}`],
          } as const),
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

  return appDetails.map((app, index) => {
    return {
      nodeId: appToNodeIndexMap[app.id as `0x${string}`],
      endorsedApp: {
        ...appDetails[index],
        metadata: {
          ...appsMetadata[index],
          logo: `https://api.gateway-proxy.vechain.org/ipfs/${appsMetadata[index]?.logo.replace("ipfs://", "")}`,
        },
      } as XAppWithMetadata,
    }
  })
}

export const getNodesEndorsedAppsQueryKey = (nodeIds: string[]) => ["XNodes", nodeIds, "ENDORSED_APPS"]

/**
 *  Hook to get the endorsed apps for a user's nodes
 * @param nodeIds  the node ids to fetch the endorsed apps for
 * @returns  the endorsed apps for the nodes
 */
export const useNodesEndorsedApps = (nodeIds: string[]) => {
  const thor = useThor()
  const { data: baseURI } = useXAppsMetadataBaseUri()

  return useQuery({
    queryKey: getNodesEndorsedAppsQueryKey(nodeIds),
    queryFn: async () => await getNodesEndorsedApps(thor, nodeIds, baseURI ?? ""),
    enabled: !!thor && !!nodeIds?.length && !!baseURI,
    // filter unendorsed apps
    select: data => data.filter(node => node.endorsedApp?.id !== UNENDORSED_APP_ID),
  })
}

/**
 *  Hook to get the endorsed app for a single node
 * @param nodeId  the node id to fetch the endorsed app for
 * @returns  the endorsed app for the node
 */
export const useNodeEndorsedApp = (nodeId?: string) => {
  const { data, ...rest } = useNodesEndorsedApps(nodeId ? [nodeId] : [])

  return {
    data: data?.[0]?.endorsedApp,
    ...rest,
  }
}
