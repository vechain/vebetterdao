import { getConfig } from "@repo/config"

/**
 * Validate IPFS URI strings. An example of a valid IPFS URI is:
 * - ipfs://QmfSTia1TJUiKQ2fyW9NTPzEKNdjMGzbUgrC3QPSTpkum6/406.json
 * - ipfs://QmVPqKfwRXjg5Fqwy6RNRbKR2ZP4pKKVLvmfjmhQfdM3MH/4
 * - ipfs://QmVPqKfwRXjg5Fqwy6RNRbKR2ZP4pKKVLvmfjmhQfdM3MH
 * @param uri
 * @returns
 */
export const validateIpfsUri = (uri: string): boolean => {
  const trimmedUri = uri.trim()
  return /^ipfs:\/\/[a-zA-Z0-9]+(\/[^/]+)*\/?$/.test(trimmedUri)
}
/**
 * Converts a CID to an IPFS native URL.
 *
 * @param cid - The CID to convert.
 * @param fileName - The name of the file to append to the URL.
 *
 * @returns The IPFS URL in the format `ipfs://${cid}/${fileName}`.
 */
export function toIPFSURL(cid: string, fileName?: string): string {
  return `ipfs://${cid}/${fileName ?? ""}`
}
/**
 * Uploads a blob to IPFS.
 * @param blob The Blob object to upload.
 * @param filename A name for the file in the FormData payload.
 * @returns The IPFS hash of the uploaded blob.
 */
export async function uploadBlobToIPFS(blob: Blob, filename: string): Promise<string> {
  try {
    const form = new FormData()
    form.append("file", blob, filename)
    const response = await fetch(getConfig().ipfsPinningService, {
      method: "POST",
      body: form,
    })
    if (!response.ok) {
      throw new Error(`Failed to upload blob to IPFS: ${response.status}`)
    }
    const { IpfsHash: ipfsHash } = (await response.json()) as { IpfsHash?: string }
    if (!ipfsHash) {
      throw new Error("IPFS pinning service response missing IpfsHash")
    }
    console.info("IPFS Hash:", ipfsHash)

    return ipfsHash
  } catch (error: any) {
    console.error("Error uploading blob:", error)
    const formattedError = error?.response?.data?.message
      ? error?.response?.data?.message
      : `${filename}: Unknown error occurred.`
    throw new Error(`Failed to upload blob to IPFS: ${formattedError}`)
  }
}
