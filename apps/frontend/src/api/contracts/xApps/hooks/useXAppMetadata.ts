import { useQuery } from "@tanstack/react-query"
import { useXApp } from "./useXApp"
import { useXAppsMetadataBaseUri } from "./useXAppsMetadataBaseUri"
import { getXAppMetadata } from "../getXAppMetadata"

export const getXAppMetadataQueryKey = (metadataURI?: string) => [" xApps", metadataURI, "metadata"]

/**
 * Hook to fetch the metadata of an xApp from the xApps metadata base uri
 * @param xAppId - The id of the xApp
 * @returns  The metadata of the xApp
 */
export const useXAppMetadata = (xAppId?: string) => {
  const { data: baseUri } = useXAppsMetadataBaseUri()
  const { data: xApp } = useXApp(xAppId ?? "")

  return useQuery({
    queryKey: getXAppMetadataQueryKey(xApp?.metadataURI || ""),
    queryFn: async () => (!(!baseUri && xApp) ? await getXAppMetadata(`${baseUri}${xApp?.metadataURI}`) : null),
    enabled: !!baseUri && !!xApp,
  })
}
