/**
 * @deprecated Superseded by `relayer-rewards-pool-v3.ts`.
 * Upgrades proxies from RelayerRewardsPoolV1 (version "1") to RelayerRewardsPoolV2 (version "2").
 * After this, run `relayer-rewards-pool-v3.ts` to reach version "3".
 */
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { RelayerRewardsPoolV2 } from "../../../../typechain-types"
import { upgradeProxy } from "../../../helpers"
import { ethers } from "hardhat"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const deployer = (await ethers.getSigners())[0]

  const relayerRewardsPoolV1 = await ethers.getContractAt(
    "RelayerRewardsPoolV1",
    config.relayerRewardsPoolContractAddress,
  )
  const currentVersion = await relayerRewardsPoolV1.version()
  console.log("Current contract version:", currentVersion)

  console.log(
    `Upgrading RelayerRewardsPool V1 → V2 at ${config.relayerRewardsPoolContractAddress} on ${config.network.name} with ${deployer.address}`,
  )

  const relayerRewardsPoolV2 = (await upgradeProxy(
    "RelayerRewardsPoolV1",
    "RelayerRewardsPoolV2",
    config.relayerRewardsPoolContractAddress,
    [],
    { version: 2 },
  )) as RelayerRewardsPoolV2

  console.log("RelayerRewardsPool upgraded to V2")

  const version = await relayerRewardsPoolV2.version()
  console.log(`New RelayerRewardsPool version: ${version}`)

  if (version !== "2") {
    throw new Error(`RelayerRewardsPool version is not 2: ${version}`)
  }

  console.log("Execution completed — now run relayer-rewards-pool-v3.ts")
  process.exit(0)
}

main()
