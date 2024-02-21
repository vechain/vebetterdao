import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { convertUriToUrl } from "@/utils"
import axios from "axios"
import { useXAppsMetadataBaseUri } from "./useXAppsMetadataBaseUri"

/**
 *
 * @param uri  - The uri of the xApps metadata
 * @returns  The metadata of the xApp
 */
export const getXAppMetadata = async (uri: string): Promise<any> => {
  console.log("uri", uri)
  const metadata = await axios.get<any>(convertUriToUrl(uri), {
    timeout: 20000,
  })

  return metadata.data
}

export const getXAppMetadataQueryKey = (xAppId?: string) => ["xApps", xAppId, "metadata"]

/**
 * Hook to fetch the metadata of an xApp from the xApps metadata base uri
 * @param xAppId - The id of the xApp
 * @returns  The metadata of the xApp
 */
export const useXAppMetadata = (xAppId?: string) => {
  const { thor } = useConnex()
  const { data: baseUri } = useXAppsMetadataBaseUri()

  return useQuery({
    queryKey: getXAppMetadataQueryKey(xAppId),
    queryFn: async () => !!baseUri && xAppId && (await getXAppMetadata(`${baseUri}${xAppId}`)),
    enabled: !!thor && !!baseUri && !!xAppId,
  })
}
