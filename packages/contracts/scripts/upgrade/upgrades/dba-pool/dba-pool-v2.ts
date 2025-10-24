import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { DBAPool } from "../../../../typechain-types"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log(
    `Upgrading DBAPool contract at address: ${config.dynamicBaseAllocationPoolContractAddress} on network: ${config.network.name}`,
  )

  const dbaPool = (await upgradeProxy(
    "DBAPoolV1",
    "DBAPool",
    config.dynamicBaseAllocationPoolContractAddress,
    [], // No initialization args for V2
    {
      version: 2,
    },
  )) as DBAPool

  console.log(`DBAPool upgraded`)

  // check that upgrade was successful
  const version = await dbaPool.version()
  console.log(`New DBAPool version: ${version}`)

  if (parseInt(version) !== 2) {
    throw new Error(`DBAPool version is not 2: ${version}`)
  }

  console.log("Execution completed")
  process.exit(0)
}

// Execute the main function
main()
