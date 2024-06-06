import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"

/**
 * xApp type
 * @property id  the xApp id
 * @property teamWalletAddress  the xApp address
 * @property name  the xApp name
 * @property metadataURI  the xApp metadata URI
 * @property createdAtTimestamp timestamp when xApp was addded
 */
export type XApp = {
  id: string
  teamWalletAddress: string
  name: string
  metadataURI: string
  createdAtTimestamp: number
}

/**
 * Returns all the available xApps in the B3TR ecosystem
 * @param thor  the thor client
 * @returns  all the available xApps in the ecosystem capped to 256 see {@link XApp}
 */
export const getXApps = async (thor: Connex.Thor): Promise<XApp[]> => {
  const functionFragment = X2EarnApps.createInterface().getFunction("apps").format("json")
  const res = await thor.account(X2EARNAPPS_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const apps = res.decoded[0]
  return apps.map((app: any) => ({
    id: app[0],
    teamWalletAddress: app[1],
    name: app[2],
    metadataURI: app[3],
    createdAtTimestamp: app[4],
  }))
}

export const getXAppsQueryKey = () => ["xApps"]

/**
 *  Hook to get all the available xApps in the B3TR ecosystem
 * @returns all the available xApps in the B3TR ecosystem capped to 256
 */
export const useXApps = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getXAppsQueryKey(),
    queryFn: async () => await getXApps(thor),
    enabled: !!thor,
  })
}
