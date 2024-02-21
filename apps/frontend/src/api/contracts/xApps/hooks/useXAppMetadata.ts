import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { convertUriToUrl } from "@/utils"
import axios from "axios"
import { useXAppsMetadataBaseUri } from "./useXAppsMetadataBaseUri"

/**
 *  Returns the baseUri of the xApps metadata
 * @param thor  the thor client
 * @returns  the baseUri of the xApps metadata
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
 *  Hook to get the baseUri of the xApps metadata
 * @returns the baseUri of the xApps metadata
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
