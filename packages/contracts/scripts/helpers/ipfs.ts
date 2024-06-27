import { formData, readFilesFromDirectory, getFolderName } from "./fs"
import axios from "axios"

// The IPFS pinning service to use
const IPFS_PINNING_SERVICE = process.env.NEXT_PUBLIC_IPFS_PINNING_SERVICE ?? ""

async function uploadDirectoryToIPFS(pathToUpload: string, path: string): Promise<[string, File[], string]> {
  try {
    const form = formData(pathToUpload)
    const response = await axios.post(IPFS_PINNING_SERVICE, form, {
      headers: {
        ...form.getHeaders(),
      },
    })

    // Extract the IPFS hash from the response
    const ipfsHash = response.data.IpfsHash
    console.log("IPFS Hash:", ipfsHash)

    const files = await readFilesFromDirectory(path)
    const folderName = getFolderName(path)

    // Return the IPFS hash
    return [ipfsHash, files, folderName]
  } catch (error) {
    console.error("Error uploading file:", error)
    throw new Error("Failed to upload directory to IPFS")
  }
}

/**
 * Constructs an IPFS URL using a CID, and optionally a folder name and a file name.
 * @param cid - The CID to convert into an IPFS URL.
 * @param fileName - The name of the file to append to the URL. Optional.
 * @param folderName - The name of the folder to append to the URL. Optional.
 * @returns The IPFS URL in the format 'ipfs://{cid}/{folderName}/{fileName}'.
 */
function toIPFSURL(cid: string, fileName?: string, folderName?: string): string {
  let url = `ipfs://${cid}`
  if (folderName) {
    url += `/${folderName}`
  }
  if (fileName) {
    url += `/${fileName}`
  }
  return url
}

export { uploadDirectoryToIPFS, toIPFSURL }
