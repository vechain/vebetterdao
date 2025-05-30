import { useXAppMetadata } from "@vechain/vechain-kit"
import { useParams } from "next/navigation"

/**
 * Custom hook to fetch and manage the current app metadata.
 * @returns An object containing the current app metadata, loading state, and error state.
 */
export const useCurrentAppMetadata = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: appMetadata, isLoading: appMetadataLoading, error: appMetadataError } = useXAppMetadata(appId)

  return {
    appMetadata,
    appMetadataLoading,
    appMetadataError,
  }
}
