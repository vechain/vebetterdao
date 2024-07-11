import { validateIpfsUri } from "./ipfs"

// The IPFS read service to use
const IPFS_FETCH_SERVICE = process.env.NEXT_PUBLIC_IPFS_FETCHING_SERVICE ?? ""

/**
 * Convert a URI to a URL
 * We support both IPFS and Arweave URIs. Both should be converted to their https gateway URLs.
 * All other URIs should pass through unchanged.
 *
 * @param uri
 */
export const convertUriToUrl = (uri: string) => {
  // if it is a data uri just return it
  if (uri.startsWith("data:")) return uri
  const splitUri = uri?.split("://")
  if (splitUri.length !== 2) throw new Error(`Invalid URI ${uri}`)
  const protocol = splitUri?.[0]?.trim()
  const uriWithoutProtocol = splitUri[1]

  switch (protocol) {
    case "ipfs":
      if (!validateIpfsUri(uri)) throw new Error(`Invalid IPFS URI ${uri}`)

      // Check cache for IPFS document

      return `${IPFS_FETCH_SERVICE}/${uriWithoutProtocol}`
    case "ar":
      return `https://arweave.net/${uriWithoutProtocol}`
    default:
      return uri
  }
}
