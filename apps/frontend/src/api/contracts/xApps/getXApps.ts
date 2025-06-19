import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"
import dayjs from "@/utils/dayjsConfig"
import { ThorClient, executeMultipleClausesCall, getXApps as getXAppsKit } from "@vechain/vechain-kit"

// Considering a new app is defined as 7 days
const NEW_APP_PERIOD_SECONDS = dayjs.duration(7, "days").asSeconds()

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
  teamWalletAddress?: string
  name: string
  metadataURI: string
  createdAtTimestamp: string
  isNew: boolean
}

/**
 * UnendorsedApp type
 * @property appAvailableForAllocationVoting - whether the app is available for allocation voting
 */
export type UnendorsedApp = XApp & {
  appAvailableForAllocationVoting?: boolean
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

export const isNewApp = (xApp?: Omit<AllApps, "isNew">) =>
  xApp ? dayjs().unix() - Number(xApp.createdAtTimestamp) <= NEW_APP_PERIOD_SECONDS : false
const isNewLookingForEndorsement = (xApp: UnendorsedApp) => xApp.createdAtTimestamp === "0"
const isInGracePeriod = (xApp: UnendorsedApp) => xApp.appAvailableForAllocationVoting
const hasLostEndorsement = (xApp: UnendorsedApp) => !xApp.appAvailableForAllocationVoting

/**
 * This function is here nad not coupled with the hook as we need it with SSR, and dapp-kit broke the pre-fetching
 * Returns all the available xApps in the B3TR ecosystem
 * @param thor  the thor client
 * @param filterBlacklisted  whether to filter blacklisted xApps
 * @returns  all the available xApps in the ecosystem capped to 256 see {@link XApp}
 */
export const getXApps = async (thor: ThorClient, filterBlacklisted = false): Promise<GetAllApps> => {
  const { active, endorsed, unendorsed, allApps } = await getXAppsKit(thor, getConfig().network.type)

  // Filter blacklisted apps only if filterBlacklisted is true
  const isAppsBlacklisted = filterBlacklisted
    ? await executeMultipleClausesCall({
        thor,
        calls: allApps.map(
          app =>
            ({
              abi: VeBetterPassport__factory.abi,
              functionName: "isBlacklisted",
              address: getConfig().veBetterPassportContractAddress as `0x${string}`,
              args: [app.id as `0x${string}`],
            }) as const,
        ),
      })
    : allApps.map(() => false)

  const allAppsFiltered = allApps
    .filter((_app, index) => isAppsBlacklisted[index] === false)
    .map(app => ({
      ...app,
      isNew: isNewApp(app),
    }))
  const activeAppsFiltered = active
    .filter((_app, index) => isAppsBlacklisted[index] === false)
    .map(app => ({
      ...app,
      isNew: isNewApp(app),
    }))
  const endorsedAppsFiltered = endorsed
    .filter((_app, index) => isAppsBlacklisted[index] === false)
    .map(app => ({
      ...app,
      isNew: isNewApp(app),
    }))
  const unendorsedAppsFiltered = unendorsed
    .filter((_app, index) => isAppsBlacklisted[index] === false)
    .map(app => ({
      ...app,
      isNew: isNewApp(app),
    }))

  const othersLookingForEndorsement = unendorsedAppsFiltered.filter(xApp => !isNewLookingForEndorsement(xApp))
  return {
    allApps: allAppsFiltered,
    active: activeAppsFiltered,
    unendorsed: unendorsedAppsFiltered,
    newLookingForEndorsement: unendorsedAppsFiltered.filter(isNewLookingForEndorsement),
    othersLookingForEndorsement,
    endorsed: endorsedAppsFiltered,
    newApps: allAppsFiltered.filter(xApp => xApp.isNew),
    gracePeriod: othersLookingForEndorsement?.filter(isInGracePeriod),
    endorsementLost: othersLookingForEndorsement?.filter(hasLostEndorsement),
  }
}
