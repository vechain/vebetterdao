import { useIpfsImage } from "../../../../api/ipfs/hooks/useIpfsImage"

import { useCurrentAppMetadata } from "./useCurrentAppMetadata"

/**
 * Custom hook that retrieves the banner of the current app.
 * It uses the `useCurrentAppMetadata` hook to get the current app's metadata,
 * and the `useIpfsImage` hook to fetch the banner from IPFS.
 *
 * @returns An object containing the banner, loading state, and error state.
 */
export const useCurrentAppBanner = () => {
  const { appMetadata, appMetadataLoading } = useCurrentAppMetadata()
  const { data: banner, isLoading: isBannerLoading, error: isBannerError } = useIpfsImage(appMetadata?.banner)
  return {
    banner: banner?.image,
    isBannerLoading: isBannerLoading || appMetadataLoading,
    isBannerError,
  }
}
