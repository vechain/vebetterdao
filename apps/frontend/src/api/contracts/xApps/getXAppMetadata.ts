import { convertUriToUrl } from "../../../utils/uri"

/**
 * The metadata of an xApp from the xApps metadata base uri
 * @property name - The name of the xApp
 * @property description - The description of the xApp
 * @property distribution_strategy - The B3TR distribution strategy of the xApp
 * @property external_url - The external url of the xApp
 * @property logo - The logo of the xApp (ipfs uri)
 * @property banner - The banner of the xApp (ipfs uri)
 * @property screenshots - The screenshots of the xApp (ipfs uri)
 * @property social_urls - The social urls of the xApp
 * @property app_urls - The app urls of the xApp
 * @property categories - The categories of the xApp
 */
export type XAppMetadata = {
  name: string
  description: string
  distribution_strategy?: string
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
  tweets: string[]
  ve_world: {
    banner: string
    featured_image: string
  }
  categories: string[]
}
/**
  dapp-kit broke the pre-fetching
   * @param uri  - The uri of the xApps metadata
   * @returns  The metadata of the xApp see {@link XAppMetadata}
   */
export const getXAppMetadata = async (uri: string): Promise<XAppMetadata | undefined> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetch(convertUriToUrl(uri), {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch xApp metadata: ${response.status}`)
    }

    return (await response.json()) as XAppMetadata
  } finally {
    clearTimeout(timeoutId)
  }
}
