import { useIpfsImage } from "../../../../api/ipfs/hooks/useIpfsImage"

import { useCurrentAppMetadata } from "./useCurrentAppMetadata"

/**
 * Custom hook that retrieves the ve world banner of the current app.
 * It uses the `useCurrentAppMetadata` hook to get the current app's metadata,
 * and the `useIpfsImage` hook to fetch the logo from IPFS.
 *
 * @returns An object containing the banner, loading state, and error state.
 */
export const useCurrentAppVeWorldBanner = () => {
  const { appMetadata, appMetadataLoading } = useCurrentAppMetadata()
  const { data, isLoading, error } = useIpfsImage(appMetadata?.ve_world?.banner)
  return {
    veWorldBanner: data?.image,
    isImageLoading: isLoading || appMetadataLoading,
    error,
  }
}
