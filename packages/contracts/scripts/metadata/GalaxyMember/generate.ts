import fs from "fs/promises"
import { toIPFSURL, uploadDirectoryToIPFS, zipFolder } from "../../helpers"
import path from "path"

/**
 * Interface for an NFT attribute.
 */
interface Attribute {
  trait_type: string
  value: string | number
}

/**
 * Interface for the NFT metadata.
 * @see NFT Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
 */
interface Metadata {
  name: string
  description: string
  image: string
  attributes: Attribute[]
}

// Array of attributes for each level of the NFT
const levelAttributes: Record<string, string | number>[] = [
  {
    Level: 1,
  },
]

const levelNames = ["VeBetterDAO Galaxy Member"]
const description = "GM Earth is a community of people who participated in voting for the governance of VeBetter DAO."

const METADATA_PATH = path.join(__dirname, "../../../metadata/galaxyMember/metadata")
const IMAGE_ZIP_PATH = path.join(__dirname, "../../../metadata/galaxyMember/images.zip")
const IMAGE_PATH = path.join(__dirname, "../../../metadata/galaxyMember/images")

/**
 * Converts a record of attributes into an array of `Attribute` objects.
 *
 * @param attributes - A record object containing the attributes to convert.
 * @returns An array of `Attribute` objects.
 */
function convertAttributes(attributes: Record<string, string | number>): Attribute[] {
  return Object.entries(attributes).map(([key, value]) => ({ trait_type: key, value }))
}

/**
 * Generates the NFT metadata for a given level.
 *
 * @param name - The name of the level.
 * @param description - The description of the level.
 * @param imagesCID - The CID of the images directory on IPFS.
 * @param attributes - The attributes of the level.
 * @param image - The image file for the level.
 *
 * @returns The generated NFT metadata.
 */
function generateMetadata(
  name: string,
  description: string,
  attributes: Record<string, string | number>,
  image: string,
): Metadata {
  return {
    name,
    description,
    image: image,
    attributes: convertAttributes(attributes),
  }
}

/**
 * Asynchronously saves the generated NFT metadata.
 * @param metadata - The `Metadata` object to save.
 */
async function saveMetadataToFile(metadata: Metadata, fileName: string): Promise<void> {
  await fs.writeFile(`${METADATA_PATH}/${fileName}.json`, JSON.stringify(metadata, null, 2))
  console.log(`Metadata saved to ${METADATA_PATH}/${fileName}`)
}

/**
 * Main function to generate and save NFT metadata.
 */
async function generateAndSaveMetadata(): Promise<void> {
  try {
    // 1. Ensure the zip folder exists
    await zipFolder(IMAGE_PATH, IMAGE_ZIP_PATH)

    // 2. Upload images to IPFS and get URL
    const [imagesIpfsUrl, images, folderName] = await uploadDirectoryToIPFS(IMAGE_ZIP_PATH, IMAGE_PATH)

    console.log("Galaxy Member Images IPFS URL:", toIPFSURL(imagesIpfsUrl, undefined, folderName))

    // 3. Generate metadata for each level
    for (let i = 0; i < levelAttributes.length; i++) {
      const image = toIPFSURL(imagesIpfsUrl, images[i].name, folderName)
      const metadata = generateMetadata(levelNames[i], description, levelAttributes[i], image)
      await saveMetadataToFile(metadata, String(i + 1))
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    throw error // Rethrow the error after logging to handle it further up the call stack.
  }
}

// Generate and save the NFT metadata
generateAndSaveMetadata()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error)
    process.exit(1)
  })
