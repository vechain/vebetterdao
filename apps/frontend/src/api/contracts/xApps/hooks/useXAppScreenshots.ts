import { useIpfsImageList } from "@/api/ipfs"
import { useXAppMetadata } from "./useXAppMetadata"

/**
 * Custom hook that retrieves the screenshots of an xApp.
 * It uses the `useXAppMetadata` and `useIpfsImageList` hooks to get the xApp's screenshots.
 *
 * @param xAppId - The id of the xApp
 * @returns An object containing the screenshots, loading state, and error state.
 *
 */

export const useXAppScreenshots = (xAppId?: string) => {
  const { data: appMetadata, isLoading: appMetadataLoading } = useXAppMetadata(xAppId)
  const screenshotsQuery = useIpfsImageList(appMetadata?.screenshots ?? [])
  const screenshots = screenshotsQuery.map(query => query.data?.image)
  const isScreenshotLoading = appMetadataLoading || screenshotsQuery.some(query => query.isLoading)
  const screenshotError = screenshotsQuery.find(query => query.error)?.error

  return {
    screenshots,
    isScreenshotLoading,
    screenshotError,
  }
}
