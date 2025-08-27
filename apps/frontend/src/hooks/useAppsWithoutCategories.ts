"use client"
import { useQuery } from "@tanstack/react-query"
import { useXApps, useXAppsMetadataBaseUri, getXAppMetadata, XApp } from "@/api"
import { DEPRECATED_IDS } from "@/types/appDetails"

export type AppWithoutCategories = XApp & {
  metadata?: {
    name: string
    description: string
    distribution_strategy?: string
    external_url: string
    logo: string
    banner: string
    screenshots: string[]
    social_urls: { name: string; url: string }[]
    app_urls: { code: string; url: string }[]
    tweets: string[]
    ve_world: { banner: string; featured_image: string }
    categories: string[]
  }
}

export const getAppsWithoutCategoriesQueryKey = (allApps: XApp[]) => [
  "xApps",
  allApps.map(app => app.id),
  "withoutCategories",
]

/**
 * Hook to fetch apps that have no categories assigned
 * @returns Array of apps without categories
 */
export const useAppsWithoutCategories = () => {
  const { data: baseUri } = useXAppsMetadataBaseUri()
  const { data: apps } = useXApps()

  return useQuery({
    queryKey: getAppsWithoutCategoriesQueryKey(apps?.allApps || []),
    queryFn: async (): Promise<AppWithoutCategories[]> => {
      if (!baseUri || !apps?.allApps) return []

      const appsWithoutCategories: AppWithoutCategories[] = []

      const promises = apps.allApps.map(async app => {
        try {
          const metadata = await getXAppMetadata(`${baseUri}${app.metadataURI}`)

          // Filter out deprecated categories and check if app has no valid categories
          const validCategories = (metadata?.categories || []).filter(id => !DEPRECATED_IDS.includes(id))

          if (validCategories.length === 0) {
            appsWithoutCategories.push({
              ...app,
              metadata,
            })
          }
        } catch (error) {
          console.error(`Error fetching metadata for app ${app.id}:`, error)
          // If metadata fetch fails, consider it as having no categories
          appsWithoutCategories.push(app)
        }
      })

      await Promise.all(promises)
      return appsWithoutCategories.sort((a, b) => a.name.localeCompare(b.name))
    },
    enabled: !!baseUri && !!apps?.allApps && apps?.allApps.length > 0,
  })
}
