import { getConfig } from "@repo/config"
import { ethers } from "ethers"
import dayjs from "dayjs"
import { ThorClient } from "@vechain/sdk-network"

const X2EARNAPPS_CONTRACT = getConfig().x2EarnAppsContractAddress
const NEW_APP_PERIOD_SECONDS = 604800 // Considering a new app is defined as 7 days

// Function selectors for the X2EarnApps contract
const unendorsedAppsSelector = ethers.id("unendorsedApps()").slice(0, 10)
const allAppsSelector = ethers.id("apps()").slice(0, 10)
const isBlacklistedSelector = ethers.id("isBlacklisted(bytes32)").slice(0, 10)

/**
 * xApp type
 * @property id - the xApp id
 * @property teamWalletAddress - the xApp address
 * @property name - the xApp name
 * @property metadataURI - the xApp metadata URI
 * @property createdAtTimestamp - timestamp when xApp was added
 * @property isNew - whether the xApp is considered new as per {@link NEW_APP_PERIOD_SECONDS}
 */
export type XApp = {
  id: string
  teamWalletAddress: string
  name: string
  metadataURI: string
  createdAtTimestamp: string
  // TODO: migration check if this is still valid?
  isNew: boolean
}

/**
 * UnendorsedApp type
 * @property appAvailableForAllocationVoting - whether the app is available for allocation voting
 */
export type UnendorsedApp = XApp & {
  appAvailableForAllocationVoting: boolean
}

export type AllApps = XApp | UnendorsedApp

export type GetAllApps = {
  allApps: AllApps[]
  active: XApp[] // Historically active apps
  unendorsed: UnendorsedApp[]
  newLookingForEndorsement: UnendorsedApp[]
  othersLookingForEndorsement: UnendorsedApp[]
  endorsed: XApp[]
  newApps: XApp[]
  gracePeriod: UnendorsedApp[]
  endorsementLost: UnendorsedApp[]
}

/**
 * This function is here nad not coupled with the hook as we need it with SSR, and dapp-kit broke the pre-fetching
 * Returns all the available xApps in the B3TR ecosystem
 * @param thor  the thor client
 * @param filterBlacklisted  whether to filter blacklisted xApps
 * @returns  all the available xApps in the ecosystem capped to 256 see {@link XApp}
 */
export const getXApps = async (thor: ThorClient, filterBlacklisted = false): Promise<GetAllApps> => {
  const clauses = [
    {
      to: X2EARNAPPS_CONTRACT,
      value: "0x0",
      data: allAppsSelector,
    },
    {
      to: X2EARNAPPS_CONTRACT,
      value: "0x0",
      data: unendorsedAppsSelector,
    },
  ]

  const res = await thor.transactions.simulateTransaction(clauses)

  const error = res.find(r => r.reverted)
  if (error) throw new Error("Error fetching xApps")

  let apps: XApp[] = []
  let unendorsedApps: UnendorsedApp[] = []
  type DecodedApp = [string, string, string, string, string, boolean]

  if (res[0]?.data) {
    const appsDecoded = ethers.AbiCoder.defaultAbiCoder().decode(
      ["tuple(bytes32,address,string,string,uint256,bool)[]"],
      res[0].data,
    )[0] as DecodedApp[]
    if (appsDecoded.length) {
      apps = appsDecoded.map(app => ({
        id: app[0],
        teamWalletAddress: app[1],
        name: app[2],
        metadataURI: app[3],
        createdAtTimestamp: app[4],
        isNew: dayjs().unix() - Number(app[4]) <= NEW_APP_PERIOD_SECONDS,
      }))
    }
  }
  if (res[1]?.data) {
    const unendorsedAppsDecoded = ethers.AbiCoder.defaultAbiCoder().decode(
      ["tuple(bytes32,address,string,string,uint256,bool)[]"],
      res[1].data,
    )[0] as DecodedApp[]
    if (unendorsedAppsDecoded.length) {
      unendorsedApps = unendorsedAppsDecoded.map((app: DecodedApp) => ({
        id: app[0],
        teamWalletAddress: app[1],
        name: app[2],
        metadataURI: app[3],
        createdAtTimestamp: app[4],
        isNew: false,
        appAvailableForAllocationVoting: app[5],
      }))
    }
  }

  // Merge apps and unendorsed apps, deduplicate by id
  const allApps = [...apps, ...unendorsedApps].filter(
    (app, index, self) => self.findIndex(a => a.id === app.id) === index,
  )

  // Filter blacklisted apps only if filterBlacklisted is true
  let allAppsFiltered = allApps
  if (filterBlacklisted) {
    const clauses2 = allApps.map(app => ({
      to: X2EARNAPPS_CONTRACT,
      value: "0x0",
      data: isBlacklistedSelector + ethers.AbiCoder.defaultAbiCoder().encode(["bytes32"], [app.id]).slice(2),
    }))
    const res2 = await thor.transactions.simulateTransaction(clauses2)

    const error2 = res2.find(r => r.reverted)
    if (error2) throw new Error("Error fetching blacklisted xApps")

    const blacklistedApps = res2.map(r => ethers.AbiCoder.defaultAbiCoder().decode(["bool"], r.data))
    allAppsFiltered = allApps.filter((_app, index) => blacklistedApps[index]?.[0] === false)
  }

  // Filter apps and unendorsed apps based on allowedAppIds
  const allowedAppIds = new Set(allAppsFiltered.map(app => app.id))
  const appsFiltered = apps.filter(app => allowedAppIds.has(app.id))
  const unendorsedAppsFiltered = unendorsedApps.filter(app => allowedAppIds.has(app.id))

  const isNewLookingForEndorsement = (xApp: UnendorsedApp) => xApp.createdAtTimestamp === "0"
  const othersLookingForEndorsement = unendorsedAppsFiltered.filter(xApp => !isNewLookingForEndorsement(xApp))
  const isInGracePeriod = (xApp: UnendorsedApp) => xApp.appAvailableForAllocationVoting
  const hasLostEndorsement = (xApp: UnendorsedApp) => !xApp.appAvailableForAllocationVoting

  return {
    allApps: allAppsFiltered,
    active: appsFiltered,
    unendorsed: unendorsedAppsFiltered,
    newLookingForEndorsement: unendorsedAppsFiltered.filter(isNewLookingForEndorsement),
    othersLookingForEndorsement,
    endorsed: appsFiltered.filter(app => !unendorsedAppsFiltered.some(uApp => uApp.id === app.id)),
    newApps: allAppsFiltered.filter(xApp => xApp.isNew),
    gracePeriod: othersLookingForEndorsement?.filter(isInGracePeriod),
    endorsementLost: othersLookingForEndorsement?.filter(hasLostEndorsement),
  }
}
