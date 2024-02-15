import { toIPFSURL, uploadDirectoryToIPFS } from "./helpers"

const METADATA_PATH = "./badge/metadata"

// NFT Storage
const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY ?? ""

/**
 * Uploads the badge metadata to IPFS using NFT.Storage.
 */
async function uploadMetadataToIpfs(): Promise<void> {
  try {
    if (!NFT_STORAGE_KEY) {
      throw new Error("NFT_STORAGE_KEY is not set")
    }

    const [metadataIpfsUrl] = await uploadDirectoryToIPFS(METADATA_PATH, NFT_STORAGE_KEY)

    console.log("Metadata IPFS URL:", toIPFSURL(metadataIpfsUrl))
  } catch (error) {
    console.error("Error uploading metadata to IPFS:", error)
    throw error // Rethrow the error after logging to handle it further up the call stack.
  }
}

// Upload the badge metadata to IPFS
uploadMetadataToIpfs()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error)
    process.exit(1)
  })
