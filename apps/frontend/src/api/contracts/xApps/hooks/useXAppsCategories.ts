import { useQuery } from "@tanstack/react-query"
import { useXAppsMetadataBaseUri } from "./useXAppsMetadataBaseUri"
import { getXAppMetadata } from "../getXAppMetadata"
import { useXApps, XApp } from "@vechain/vechain-kit"

export const getXAppsCategoriesQueryKey = (allApps: XApp[]) => ["xApps", allApps, "categories"]

/**
 * Hook to fetch categories from all the xApps
 * @returns Array of categories for each xApp or []
 */
export const useXAppsCategories = () => {
  const { data: baseUri } = useXAppsMetadataBaseUri()
  const { data: apps } = useXApps()

  const allAppsWithCategories: Record<string, string[]> = {}

  return useQuery({
    queryKey: getXAppsCategoriesQueryKey(apps?.allApps || []),
    queryFn: async () => {
      if (!baseUri || !apps?.allApps) return {}

      const promises = apps?.allApps.map(async (app, index) => {
        try {
          const appDetails = apps?.allApps[index]
          const metadata = await getXAppMetadata(`${baseUri}${appDetails?.metadataURI}`)
          allAppsWithCategories[app.id] = metadata?.categories || []
        } catch (error) {
          console.error(`Error fetching categories for app ${app.id}:`, error)
          allAppsWithCategories[app.id] = []
        }
      })

      await Promise.all(promises)
      return allAppsWithCategories
    },
    enabled: !!baseUri && !!apps?.allApps && apps?.allApps.length > 0,
  })
}
