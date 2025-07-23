import { getConfig } from "@repo/config"
import dayjs from "@/utils/dayjsConfig"
import { ThorClient, XAppMetadata, executeMultipleClausesCall } from "@vechain/vechain-kit"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"

const abi = X2EarnApps__factory.abi
const address = getConfig().x2EarnAppsContractAddress as `0x${string}`

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

export type XAppWithMetadata = XApp & {
  metadata: XAppMetadata
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
  const [active, unendorsed] = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        abi,
        functionName: "apps",
        address,
        args: [],
      },
      {
        abi,
        functionName: "unendorsedApps",
        address,
        args: [],
      },
    ],
  })

  let activeApps = active.map(app => ({
    ...app,
    createdAtTimestamp: app.createdAtTimestamp.toString(),
    isNew: isNewApp({ ...app, createdAtTimestamp: app.createdAtTimestamp.toString() }),
  }))

  let unendorsedApps = unendorsed.map(app => ({
    ...app,
    createdAtTimestamp: app.createdAtTimestamp.toString(),
    isNew: isNewApp({ ...app, createdAtTimestamp: app.createdAtTimestamp.toString() }),
  }))

  if (filterBlacklisted) {
    const isAppsBlacklisted = await executeMultipleClausesCall({
      thor,
      calls: [...active, ...unendorsed].map(
        app =>
          ({
            abi: X2EarnApps__factory.abi,
            functionName: "isBlacklisted",
            address: getConfig().x2EarnAppsContractAddress as `0x${string}`,
            args: [app.id as `0x${string}`],
          }) as const,
      ),
    })
    activeApps = activeApps.filter((_app, index) => isAppsBlacklisted[index] === false)
    unendorsedApps = unendorsedApps.filter((_app, index) => isAppsBlacklisted[index] === false)
  }

  const unendorsedIds = new Set(unendorsedApps.map(app => app.id))

  const allApps = [...activeApps, ...unendorsedApps]
  const endorsedApps = activeApps.filter(app => !unendorsedIds.has(app.id))
  const othersLookingForEndorsement = unendorsedApps.filter(xApp => !isNewLookingForEndorsement(xApp))

  return {
    allApps,
    active: activeApps,
    unendorsed: unendorsedApps,
    newLookingForEndorsement: unendorsedApps.filter(isNewLookingForEndorsement),
    othersLookingForEndorsement,
    endorsed: endorsedApps,
    newApps: allApps.filter(xApp => xApp.isNew),
    gracePeriod: othersLookingForEndorsement?.filter(isInGracePeriod),
    endorsementLost: othersLookingForEndorsement?.filter(hasLostEndorsement),
  }
}
