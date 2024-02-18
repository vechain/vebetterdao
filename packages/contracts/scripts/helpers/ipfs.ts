import { NFTStorage } from "nft.storage"
import { readFilesFromDirectory } from "./fs"

/**
 * Uploads a directory to IPFS using NFT.Storage.
 *
 * @param path - The path to the directory to upload.
 * @param nftStorageKey - The NFT.Storage API key.
 * @param lengthCheck - The number of files to check for in the directory.
 *
 * @returns A promise that resolves to the CID of the uploaded directory and the array of `File` objects.
 *
 * @throws An error if the number of files in the directory does not match the length check.
 */
async function uploadDirectoryToIPFS(
  path: string,
  nftStorageKey: string,
  lengthCheck?: number,
): Promise<[string, File[]]> {
  const nftStorageClient = new NFTStorage({
    token: nftStorageKey,
  })

  const files = await readFilesFromDirectory(path)

  if (lengthCheck && files.length !== lengthCheck) {
    throw new Error("Number of images does not match number of levels")
  }

  return [await nftStorageClient.storeDirectory(files), files]
}

/**
 * Converts a CID to an IPFS native URL.
 *
 * @param cid - The CID to convert.
 * @param fileName - The name of the file to append to the URL.
 *
 * @returns The IPFS URL in the format `ipfs://${cid}/${fileName}`.
 */
function toIPFSURL(cid: string, fileName?: string): string {
  return `ipfs://${cid}/${fileName ?? ""}`
}

export { uploadDirectoryToIPFS, toIPFSURL }
