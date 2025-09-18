import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { VOT3 } from "../../../../typechain-types"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log(`Upgrading VOT3 contract at address: ${config.vot3ContractAddress} on network: ${config.network.name}`)

  const vot3v2 = (await upgradeProxy("VOT3V1", "VOT3", config.vot3ContractAddress, [], {
    version: 2,
  })) as VOT3

  console.log(`VOT3 upgraded`)

  // check that upgrade was successful
  const version = await vot3v2.version()
  console.log(`New VOT3 version: ${version}`)

  if (parseInt(version) !== 2) {
    throw new Error(`VOT3 version is not 2: ${version}`)
  }

  console.log("Execution completed")
  process.exit(0)
}

// Execute the main function
main()
