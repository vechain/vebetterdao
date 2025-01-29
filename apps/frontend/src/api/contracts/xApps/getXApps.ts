import { getConfig } from "@repo/config"
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"
import { abi } from "thor-devkit"
import dayjs from "dayjs"
const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
const unendorsedAppsFragment = X2EarnApps.createInterface().getFunction("unendorsedApps").format("json")
const unendorsedAppsAbi = new abi.Function(JSON.parse(unendorsedAppsFragment))
const allAppsFragment = X2EarnApps.createInterface().getFunction("apps").format("json")
const allAppsAbi = new abi.Function(JSON.parse(allAppsFragment))
const NEW_APP_TIMESTAMP_IN_SECOND = 604800 // Considering a new app is defined as 7 days

/**
 * xApp type
 * @property id  the xApp id
 * @property teamWalletAddress  the xApp address
 * @property name  the xApp name
 * @property metadataURI  the xApp metadata URI
 * @property createdAtTimestamp timestamp when xApp was added
 */
export type XApp = {
  id: string
  teamWalletAddress: string
  name: string
  metadataURI: string
  createdAtTimestamp: string
  isNew: boolean
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

type GetAllApps = {
  active: XApp[]
  unendorsed: UnendorsedApp[]
  allApps: (XApp | UnendorsedApp)[]
  endorsed: XApp[]
  newApps: XApp[]
}
export const getXApps = async (thor: Connex.Thor): Promise<GetAllApps> => {
  const clauses = [
    {
      to: X2EARNAPPS_CONTRACT,
      value: 0,
      data: allAppsAbi.encode(),
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
    const appsDecoded = allAppsAbi.decode(res[0]?.data)[0]
    if (appsDecoded.length) {
      apps = appsDecoded.map((app: any) => ({
        id: app[0],
        teamWalletAddress: app[1],
        name: app[2],
        metadataURI: app[3],
        createdAtTimestamp: app[4],
        isNew: dayjs().unix() - Number(app[4]) <= NEW_APP_TIMESTAMP_IN_SECOND,
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

  const allApps = [...apps, ...unendorsedApps].filter(
    (app, index, self) => self.findIndex(a => a.id === app.id) === index,
  ) // all apps is a union of active and unendorsed apps with deduplication

  // all apps created within the last NEW_APP_TIMESTAMP_IN_SECOND
  const newApps = apps.filter(app => dayjs().unix() - Number(app.createdAtTimestamp) <= NEW_APP_TIMESTAMP_IN_SECOND)

  return {
    allApps: allApps,
    active: apps,
    unendorsed: unendorsedApps,
    endorsed: apps.filter(app => !unendorsedApps.some(unendorsedApp => unendorsedApp.id === app.id)),
    newApps: newApps,
  }
}
