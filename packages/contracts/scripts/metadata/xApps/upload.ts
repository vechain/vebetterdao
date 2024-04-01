import fs from "fs/promises"
import { readFilesFromDirectory } from "../../helpers"
import { NFTStorage } from "nft.storage"
import path from "path"

const NFT_STORAGE_KEY = process.env.NEXT_PUBLIC_NFT_STORAGE_KEY ?? ""
const OUTPUT_PATH = path.join(__dirname, `../../../metadata/xApps/output`)

const uploadToIpfs = async () => {
  const nftStorageClient = new NFTStorage({
    token: NFT_STORAGE_KEY,
  })

  // upload all files in output folder to IPFS
  const entries = await readFilesFromDirectory(OUTPUT_PATH)
  for (const entry of entries) {
    const file = await fs.readFile(OUTPUT_PATH + "/" + entry.name, "utf8")
    const data = new Blob([file], { type: "application/json" })
    const cdir = await nftStorageClient.storeBlob(data)

    console.log("Metadata uploaded", JSON.parse(file).name, entry.name, cdir)
  }
}

uploadToIpfs()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error)
    process.exit(1)
  })
