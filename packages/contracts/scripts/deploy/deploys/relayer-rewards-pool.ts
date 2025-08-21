import { deployAndInitializeLatest } from "../../helpers"
import { RelayerRewardsPool } from "../../../typechain-types"
import { getConfig } from "@repo/config"
import { EnvConfig, getContractsConfig } from "@repo/config/contracts"
import { ethers } from "hardhat"
import { AppEnv } from "@repo/config/contracts"

/**
 * This script is used to deploy the RelayerRewardsPool contract that is not associated with contracts.
 * This is for those who only cares about testing the RelayerRewardsPool specific storage or features.
 */
export async function main() {
  const config = getContractsConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const envConfig = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const localConfig = getConfig(AppEnv.LOCAL)
  const deployer = (await ethers.getSigners())[0]

  const TEMP_ADMIN = envConfig.network.name === "solo" ? config.CONTRACTS_ADMIN_ADDRESS : deployer.address

  console.log(
    `================  Deploying contracts on ${envConfig.network.name} (${envConfig.nodeUrl}) with ${envConfig.environment} configurations `,
  )
  console.log(`================  Address used to deploy: ${deployer.address}`)

  const b3trAddress = localConfig.b3trContractAddress
  const emissionsAddress = localConfig.emissionsContractAddress

  const relayerRewardsPool = (await deployAndInitializeLatest(
    "RelayerRewardsPool",
    [
      {
        name: "initialize",
        args: [
          TEMP_ADMIN, // admin
          TEMP_ADMIN, // upgrader
          b3trAddress, // b3trAddress
          emissionsAddress, // emissionsAddress
        ],
      },
    ],
    {},
    true,
  )) as RelayerRewardsPool

  await relayerRewardsPool.waitForDeployment()

  console.log("RelayerRewardsPool address: ", await relayerRewardsPool.getAddress())

  console.log("================  Execution completed")
  process.exit(0)
}

main()
