import { uploadMetadataToIpfs } from "../upload"

// Upload the badge metadata to IPFS
uploadMetadataToIpfs("./metadata/xApps/output")
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Unhandled error:", error)
    process.exit(1)
  })
