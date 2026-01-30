import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { X2EarnCreator } from "../../../../typechain-types"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log(
    `Upgrading X2EarnCreator contract at address: ${config.x2EarnCreatorContractAddress} on network: ${config.network.name}`,
  )

  const x2EarnCreator = (await upgradeProxy(
    "X2EarnCreatorV1",
    "X2EarnCreator",
    config.x2EarnCreatorContractAddress,
    [],
    {
      version: 2,
    },
  )) as X2EarnCreator

  console.log(`X2EarnCreator upgraded`)

  const version = await x2EarnCreator.version()
  console.log(`New X2EarnCreator version: ${version}`)

  if (BigInt(version) !== 2n) {
    throw new Error(`X2EarnCreator version is not the expected one: ${version}`)
  }

  console.log("Execution completed")

  process.exit(0)
}

main()
