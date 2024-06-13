import { useIpfsImage } from "@/api/ipfs"
import { useCurrentAppMetadata } from "./useCurrentAppMetadata"

/**
 * Custom hook that retrieves the logo of the current app.
 * It uses the `useCurrentAppMetadata` hook to get the current app's metadata,
 * and the `useIpfsImage` hook to fetch the logo from IPFS.
 *
 * @returns An object containing the logo, loading state, and error state.
 */
export const useCurrentAppLogo = () => {
  const { appMetadata, appMetadataLoading } = useCurrentAppMetadata()
  const { data, isLoading: isLogoLoading, error: isLogoError } = useIpfsImage(appMetadata?.logo)

  return {
    logo: data?.image,
    isLogoLoading: isLogoLoading || appMetadataLoading,
    isLogoError,
  }
}
