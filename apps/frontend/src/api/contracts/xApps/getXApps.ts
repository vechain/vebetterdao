import { getConfig } from "@repo/config"
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"
import { abi } from "thor-devkit"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
const activeAppsFragment = X2EarnApps.createInterface().getFunction("apps").format("json")
const unendorsedAppsFragment = X2EarnApps.createInterface().getFunction("unendorsedApps").format("json")
const activeAppsAbi = new abi.Function(JSON.parse(activeAppsFragment))
const unendorsedAppsAbi = new abi.Function(JSON.parse(unendorsedAppsFragment))

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

export type UnendorsedApp = XApp & {
  appAvailableForAllocationVoting: boolean
}

/**
 * This function is here nad not coupled with the hook as we need it with SSR, and dapp-kit broke the pre-fetching
 * Returns all the available xApps in the B3TR ecosystem
 * @param thor  the thor client
 * @returns  all the available xApps in the ecosystem capped to 256 see {@link XApp}
 */
export const getXApps = async (thor: Connex.Thor): Promise<{ active: XApp[]; unendorsed: UnendorsedApp[] }> => {
  const clauses = [
    {
      to: X2EARNAPPS_CONTRACT,
      value: 0,
      data: activeAppsAbi.encode(),
    },
    {
      to: X2EARNAPPS_CONTRACT,
      value: 0,
      data: unendorsedAppsAbi.encode(),
    },
  ]

  const res = await thor.explain(clauses).execute()

  const error = res.find(r => r.reverted)?.revertReason

  if (error) throw new Error(error ?? "Error fetching xApps")

  let apps: XApp[] = []
  let unendorsedApps: UnendorsedApp[] = []

  if (res[0]?.data) {
    const appsDecoded = activeAppsAbi.decode(res[0]?.data)[0]
    if (appsDecoded.length) {
      apps = appsDecoded.map((app: any) => ({
        id: app[0],
        teamWalletAddress: app[1],
        name: app[2],
        metadataURI: app[3],
        createdAtTimestamp: app[4],
      }))
    }
  }
  if (res[1]?.data) {
    const unendorsedAppsDecoded = unendorsedAppsAbi.decode(res[1]?.data)[0]
    if (unendorsedAppsDecoded.length) {
      unendorsedApps = unendorsedAppsDecoded.map((app: any) => ({
        id: app[0],
        teamWalletAddress: app[1],
        name: app[2],
        metadataURI: app[3],
        createdAtTimestamp: app[4],
        appAvailableForAllocationVoting: app[5],
      }))
    }
  }

  return {
    active: apps,
    unendorsed: unendorsedApps,
  }
}
