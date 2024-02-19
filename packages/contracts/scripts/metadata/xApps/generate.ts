import fs from "fs/promises"
import { toIPFSURL, uploadDirectoryToIPFS } from "../../helpers"
import path from "path"
import { ethers } from "ethers"

interface SocialUrl {
  name: string
  url: string
}

interface AppUrl {
  code: string
  url: string
}

interface XAppMetadata {
  name: string
  description: string
  external_url: string
  logo: string
  banner: string
  screenshots: string[]
  social_urls: SocialUrl[]
  app_urls: AppUrl[]
}

const SRC_JSON_PATH = path.join(__dirname, `../../../metadata/xApps/src/json`)
const MEDIA_PATH = path.join(__dirname, "../../../metadata/xApps/src/media")
const OUTPUT_PATH = path.join(__dirname, `../../../metadata/xApps/output`)

// NFT Storage
const NFT_STORAGE_KEY = process.env.NFT_STORAGE_KEY ?? ""

/**
 * Main function to generate and save x-apps metadata.
 */
async function generateAndSaveMetadata(): Promise<void> {
  try {
    if (!NFT_STORAGE_KEY) {
      throw new Error("NFT_STORAGE_KEY is not set")
    }

    // get metadata templates from the source directory
    const files = await fs.readdir(SRC_JSON_PATH)

    // for each file, generate metadata and save to output folder
    for (const file of files) {
      const metadata: XAppMetadata = await generateMetadata(file)

      // the output filename must be the hash of the name (which will also be the id of the x-app)
      const id = ethers.keccak256(ethers.toUtf8Bytes(metadata.name))
      await saveMetadataToFile(metadata, id)
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    throw error // Rethrow the error after logging to handle it further up the call stack.
  }
}

const generateMetadata = async (file: string): Promise<XAppMetadata> => {
  console.log(`Processing ${file}`)

  const metadata: XAppMetadata = JSON.parse(await fs.readFile(path.join(SRC_JSON_PATH, file), "utf-8"))
  const filename = path.parse(file).name

  await validateMediaFiles(filename)

  const media = await uploadDirectoryToIPFS(`${MEDIA_PATH}/${filename}`, NFT_STORAGE_KEY)

  metadata.banner = toIPFSURL(media[0], "banner.png")
  metadata.logo = toIPFSURL(media[0], "logo.png")

  return metadata
}

const validateMediaFiles = async (filename: string) => {
  const media = await fs.readdir(`${MEDIA_PATH}/${filename}`)

  // media must contain 2 files: a logo and a banner
  if (media.length !== 2) {
    throw new Error(`Invalid media files for ${filename}`)
  }

  const logo = await fs.readFile(`${MEDIA_PATH}/${filename}/logo.png`)
  const banner = await fs.readFile(`${MEDIA_PATH}/${filename}/banner.png`)
  if (!logo || !banner) {
    throw new Error(`Invalid media files for ${filename}`)
  }
}

/**
 * Asynchronously saves the generated metadata.
 * @param metadata - The `XAppMetadata` object to save.
 */
async function saveMetadataToFile(metadata: XAppMetadata, fileName: string): Promise<void> {
  await fs.writeFile(`${OUTPUT_PATH}/${fileName}.json`, JSON.stringify(metadata, null, 2))
  console.log(`Metadata saved to ${OUTPUT_PATH}/${fileName}.json`)
}

// Generate and save the NFT metadata
generateAndSaveMetadata()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error)
    process.exit(1)
  })
