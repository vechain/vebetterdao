import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { RelayerRewardsPool } from "../../../../typechain-types"
import { upgradeProxy } from "../../../helpers"
import { ethers } from "hardhat"

/**
 * Upgrade an existing RelayerRewardsPool proxy from legacy implementation (version "2") to 3.
 * Proxies still on RelayerRewardsPoolV1 (version "1") must run the deprecated migration first:
 * `scripts/upgrade/upgrades/relayer-rewards-pool/deprecated/relayer-rewards-pool-v2.ts`
 */
async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const deployer = (await ethers.getSigners())[0]

  const relayerRewardsPool = await ethers.getContractAt(
    "RelayerRewardsPoolV2",
    config.relayerRewardsPoolContractAddress,
  )
  const currentVersion = await relayerRewardsPool.version()
  console.log("Current RelayerRewardsPool version:", currentVersion)

  if (currentVersion === "3") {
    console.log("RelayerRewardsPool is already version 3")
    process.exit(0)
  }

  if (currentVersion === "1") {
    throw new Error(
      `RelayerRewardsPool is still V1 (version 1). Run scripts/upgrade/upgrades/relayer-rewards-pool/deprecated/relayer-rewards-pool-v2.ts first.`,
    )
  }

  if (currentVersion !== "2") {
    throw new Error(
      `RelayerRewardsPool must be version "2" (legacy bytecode) before this v3 upgrade (got ${currentVersion}). If already on current implementation, version should be "3".`,
    )
  }

  console.log(
    `Upgrading RelayerRewardsPool at ${config.relayerRewardsPoolContractAddress} on ${config.network.name} with ${deployer.address}`,
  )

  const upgraded = (await upgradeProxy(
    "RelayerRewardsPoolV2",
    "RelayerRewardsPool",
    config.relayerRewardsPoolContractAddress,
    [],
    { version: 3 },
  )) as RelayerRewardsPool

  const version = await upgraded.version()
  console.log(`New RelayerRewardsPool version: ${version}`)

  if (version !== "3") {
    throw new Error(`RelayerRewardsPool version is not 3: ${version}`)
  }

  console.log("Execution completed")
  process.exit(0)
}

main()
