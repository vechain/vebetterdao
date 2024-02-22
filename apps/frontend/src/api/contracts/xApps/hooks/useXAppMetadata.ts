import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { convertUriToUrl } from "@/utils"
import axios from "axios"
import { useXAppsMetadataBaseUri } from "./useXAppsMetadataBaseUri"

/**
 * The metadata of an xApp from the xApps metadata base uri
 * @property name - The name of the xApp
 * @property description - The description of the xApp
 * @property external_url - The external url of the xApp
 * @property logo - The logo of the xApp (ipfs uri)
 * @property banner - The banner of the xApp (ipfs uri)
 * @property screenshots - The screenshots of the xApp (ipfs uri)
 * @property social_urls - The social urls of the xApp
 * @property app_urls - The app urls of the xApp
 */
type XAppMetadata = {
  name: string
  description: string
  external_url: string
  logo: string
  banner: string
  screenshots: string[]
  social_urls: {
    name: string
    url: string
  }[]
  app_urls: {
    code: string
    url: string
  }[]
}
/**
 *
 * @param uri  - The uri of the xApps metadata
 * @returns  The metadata of the xApp see {@link XAppMetadata}
 */
export const getXAppMetadata = async (uri: string): Promise<XAppMetadata> => {
  const metadata = await axios.get<XAppMetadata>(convertUriToUrl(uri), {
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
    queryFn: async () => (!(!baseUri && xAppId) ? await getXAppMetadata(`${baseUri}${xAppId}`) : null),
    enabled: !!thor && !!baseUri && !!xAppId,
  })
}
