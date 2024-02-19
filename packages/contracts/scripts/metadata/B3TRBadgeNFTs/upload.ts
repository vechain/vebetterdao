import { uploadMetadataToIpfs } from "../upload"

uploadMetadataToIpfs("./ipfs/badge/metadata")
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error)
    process.exit(1)
  })
