import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { upgradeProxy } from "../../../helpers"
import { VOT3 } from "../../../../typechain-types"

async function main() {
  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log("Upgrading VOT3 to V2...")

  const vot3 = (await upgradeProxy(
    "VOT3V1",
    "VOT3",
    config.vot3ContractAddress,
    [config.navigatorRegistryContractAddress],
    {
      version: 2,
    },
  )) as unknown as VOT3

  const version = await vot3.version()
  console.log(`New VOT3 version: ${version}`)

  if (version !== "2") {
    throw new Error(`VOT3 version is not the expected one: ${version}`)
  }

  console.log("Execution completed")
  process.exit(0)
}

main()
