import { AllApps, GetAllApps, UnendorsedApp, XApp } from "./getXApps"
import { getXAppMetadata, XAppMetadata } from "./getXAppMetadata"
import { getXAppsMetadataBaseUri } from "./getXAppsMetadataBaseUri"

type MetadataCache = Map<string, XAppMetadata | undefined>

/**
 * Sorts a list of apps alphabetically by name
 */
const sortByName = <T extends XApp>(apps: T[]): T[] => [...apps].sort((a, b) => a.name.localeCompare(b.name))

/**
 * Gets the name of an app from its metadata
 */
const getAppMetadataName = async (app: XApp, baseUri: string, metadataCache: MetadataCache) => {
  const uri = `${baseUri}${app.metadataURI}`
  let metadata: XAppMetadata | undefined

  if (!metadataCache.has(uri)) {
    metadata = await getXAppMetadata(uri)
    metadataCache.set(uri, metadata)
  } else {
    metadata = metadataCache.get(uri)
  }

  return metadata?.name ?? app.name
}

/**
 * Sorts all XApps alphabetically by name, fetching metadata if needed
 */
export const sortXAppsAlphabetically = async (apps: GetAllApps | undefined, thor: Connex.Thor): Promise<GetAllApps> => {
  if (!apps) return {} as GetAllApps

  const baseUri = await getXAppsMetadataBaseUri(thor)
  const result = apps

  // Store already fetched metadata to avoid dupps
  const metadataCache: MetadataCache = new Map<string, XAppMetadata | undefined>()

  const eachAppObject = Object.entries(apps)

  // Process all app collections in parallel
  await Promise.all(
    eachAppObject.map(async ([key, appList]) => {
      if (!Array.isArray(appList) || appList.length === 0) return

      // Get updated apps with metadata
      const updatedApps = await Promise.all(
        appList.map(async app => {
          const name = await getAppMetadataName(app, baseUri, metadataCache)
          return { ...app, name }
        }),
      )

      result[key as keyof GetAllApps] = sortByName(updatedApps) as AllApps[] & XApp[] & UnendorsedApp[]
    }),
  )

  return result
}
