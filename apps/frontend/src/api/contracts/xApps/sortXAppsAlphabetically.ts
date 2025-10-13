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
  // Modifying the apps name with the metadata names, instead of using the name from the contract
  const replaceAppsNameWithMetadata = async <T extends XApp | UnendorsedApp>(apps: T[]): Promise<T[]> => {
    return Promise.all(
      apps.map(async app => {
        const uri = `${baseUri}${app.metadataURI}`
        const metadata = await getXAppMetadata(uri)
        return { ...app, name: metadata?.name || app.name }
      }),
    )
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
