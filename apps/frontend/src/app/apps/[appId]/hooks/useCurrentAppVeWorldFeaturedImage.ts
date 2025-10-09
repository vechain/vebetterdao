import { useIpfsImage } from "../../../../api/ipfs/hooks/useIpfsImage"

import { useCurrentAppMetadata } from "./useCurrentAppMetadata"

/**
 * Custom hook that retrieves the ve world featured image of the current app.
 * It uses the `useCurrentAppMetadata` hook to get the current app's metadata,
 * and the `useIpfsImage` hook to fetch the logo from IPFS.
 *
 * @returns An object containing the featured image, loading state, and error state.
 */
export const useCurrentAppVeWorldFeaturedImage = () => {
  const { appMetadata, appMetadataLoading } = useCurrentAppMetadata()
  const { data, isLoading, error } = useIpfsImage(appMetadata?.ve_world?.featured_image)
  return {
    veWorldFeaturedImage: data?.image,
    isImageLoading: isLoading || appMetadataLoading,
    error,
  }
}
