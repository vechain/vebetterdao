import { HttpClient } from "@vechain/sdk-network"

import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { normalize, removePrefix } from "@repo/utils/HexUtils"

import { version, signalUserWithReason, signaledCounter } from "./methods"

const ENVIRONMENT = process.env.TEST_ENVIRONMENT || "testnet"
const NODE_URL = getConfig(ENVIRONMENT as "testnet" | "local").nodeUrl

const main = async () => {
  try {
    const userAddress = process.argv[2]
    if (!userAddress) {
      throw new Error("User address is required")
    }

    console.log("NODE_URL", NODE_URL)

    const thor = new ThorClient(new HttpClient(NODE_URL), { isPollingEnabled: false })
    const getVersion = await version(thor)
    console.log("VeBetterPassport Contract version:", getVersion)

    await signalUserWithReason(thor, userAddress, "From script: signal user")
    console.log("Signal user once")
    await signalUserWithReason(thor, userAddress, "From script: signal user again")
    console.log("Signal user twice")

    const getSignaledCounter = await signaledCounter(thor, userAddress)
    console.log("Signaled counter:", removePrefix(normalize(getSignaledCounter.toString())))
  } catch (error) {
    throw error
  }
}

// Execute main function if this script is run directly
if (require.main === module) {
  main()
    .then(() => console.log("Process completed successfully"))
    .catch(error => {
      console.error("Process failed:", error.message)
      process.exit(1)
    })
}
