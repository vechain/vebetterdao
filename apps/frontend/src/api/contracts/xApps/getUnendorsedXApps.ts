import { getConfig } from "@repo/config"
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"
import { XApp } from "./getXApps"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress

/**
 * This function is here nad not coupled with the hook as we need it with SSR, and dapp-kit broke the pre-fetching
 * Returns all the unendorsed xApps in the B3TR ecosystem
 * @param thor  the thor client
 * @returns  all the unendorsed xApps in the ecosystem capped to 256 see {@link XApp}
 */
export const getUnendorsedXApps = async (thor: Connex.Thor): Promise<XApp[]> => {
  const functionFragment = X2EarnApps.createInterface().getFunction("unendorsedApps").format("json")
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
