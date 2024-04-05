import { toIPFSURL, uploadDirectoryToIPFS } from "."

// NFT Storage
const NFT_STORAGE_KEY = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY ?? ""

export async function uploadMetadataToIpfs(METADATA_PATH: string): Promise<void> {
  try {
    if (!NFT_STORAGE_KEY) {
      throw new Error("NEXT_PUBLIC_NFT_STORAGE_KEY is not set")
    }

    const [metadataIpfsUrl] = await uploadDirectoryToIPFS(METADATA_PATH, NFT_STORAGE_KEY)

    console.log("Metadata IPFS URL:", toIPFSURL(metadataIpfsUrl))
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error)
    throw error // Rethrow the error after logging to handle it further up the call stack.
  }
}
