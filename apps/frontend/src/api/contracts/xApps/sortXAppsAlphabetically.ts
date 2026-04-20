import { getXAppMetadata } from "./getXAppMetadata"
import { GetAllApps, XApp, UnendorsedApp } from "./getXApps"

export const sortXAppsAlphabetically = async ({
  apps,
  baseUri,
}: {
  apps: GetAllApps | undefined
  baseUri: string
}): Promise<GetAllApps> => {
  if (!apps) return {} as GetAllApps
  // Modifying the apps name with the metadata names, instead of using the name from the contract.
  // A single failed metadata fetch (e.g. IPFS gateway error) must not drop the whole apps list:
  // fall back to the contract-provided name for that app.
  const replaceAppsNameWithMetadata = async <T extends XApp | UnendorsedApp>(apps: T[]): Promise<T[]> => {
    const results = await Promise.allSettled(
      apps.map(async app => {
        const uri = `${baseUri}${app.metadataURI}`
        const metadata = await getXAppMetadata(uri)
        return { ...app, name: metadata?.name || app.name }
      }),
    )
    return results.map((result, index) => (result.status === "fulfilled" ? result.value : apps[index]))
  }
  // Sorting the apps name
  const sortByName = <T extends { name: string }>(apps: T[]): T[] =>
    [...apps].sort((a, b) => a.name.localeCompare(b.name))
  return {
    allApps: sortByName(await replaceAppsNameWithMetadata(apps.allApps)),
    active: sortByName(await replaceAppsNameWithMetadata(apps.active)),
    unendorsed: sortByName(await replaceAppsNameWithMetadata(apps.unendorsed)),
    newLookingForEndorsement: sortByName(await replaceAppsNameWithMetadata(apps.newLookingForEndorsement)),
    othersLookingForEndorsement: sortByName(await replaceAppsNameWithMetadata(apps.othersLookingForEndorsement)),
    endorsed: sortByName(await replaceAppsNameWithMetadata(apps.endorsed)),
    newApps: sortByName(await replaceAppsNameWithMetadata(apps.newApps)),
    gracePeriod: sortByName(await replaceAppsNameWithMetadata(apps.gracePeriod)),
    endorsementLost: sortByName(await replaceAppsNameWithMetadata(apps.endorsementLost)),
  }
}
