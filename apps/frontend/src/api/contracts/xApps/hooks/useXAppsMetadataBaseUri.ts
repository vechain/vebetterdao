import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getXAppsMetadataBaseUri } from "../getXAppsMetadataBaseUri"

export const getXAppsMetadataBaseUriQueryKey = () => ["xApps", "metadata", "baseUri"]

/**
 *  Hook to get the baseUri of the xApps metadata
 * @returns the baseUri of the xApps metadata
 */
export const useXAppsMetadataBaseUri = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getXAppsMetadataBaseUriQueryKey(),
    queryFn: async () => await getXAppsMetadataBaseUri(thor),
    enabled: !!thor,
    staleTime: 1000 * 60 * 60, // 1 hour,
  })
}
