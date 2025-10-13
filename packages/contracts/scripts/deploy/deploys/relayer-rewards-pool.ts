import { deployAndInitializeLatest } from "../../helpers"
import { RelayerRewardsPool } from "../../../typechain-types"
import { getConfig } from "@repo/config"
import { EnvConfig, getContractsConfig } from "@repo/config/contracts"
import { ethers } from "hardhat"

/**
 * This script deploys the RelayerRewardsPool contract required for auto-voting functionality.
 * This must be deployed BEFORE upgrading XAllocationVoting to v8 and VoterRewards to v6.
 */
export async function main() {
  const config = getContractsConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const envConfig = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const deployer = (await ethers.getSigners())[0]

  const TEMP_ADMIN = envConfig.network.name === "solo" ? config.CONTRACTS_ADMIN_ADDRESS : deployer.address

  console.log(
    `================  Deploying RelayerRewardsPool on ${envConfig.network.name} (${envConfig.nodeUrl}) with ${envConfig.environment} configurations `,
  )
  console.log(`================  Address used to deploy: ${deployer.address}`)

  // Validate required contract addresses exist
  if (!envConfig.b3trContractAddress) {
    throw new Error("B3TR contract address not found in config")
  }
  if (!envConfig.emissionsContractAddress) {
    throw new Error("Emissions contract address not found in config")
  }
  if (!envConfig.xAllocationVotingContractAddress) {
    throw new Error("XAllocationVoting contract address not found in config")
  }

  const relayerRewardsPool = (await deployAndInitializeLatest(
    "RelayerRewardsPool",
    [
      {
        name: "initialize",
        args: [
          TEMP_ADMIN, // admin
          TEMP_ADMIN, // upgrader
          envConfig.b3trContractAddress, // b3trAddress
          envConfig.emissionsContractAddress, // emissionsAddress
          envConfig.xAllocationVotingContractAddress, // xAllocationVotingAddress
        ],
      },
    ],
    {},
    true,
  )) as RelayerRewardsPool

  await relayerRewardsPool.waitForDeployment()

  const relayerRewardsPoolAddress = await relayerRewardsPool.getAddress()
  console.log("RelayerRewardsPool deployed at address: ", relayerRewardsPoolAddress)

  // Verify deployment
  const version = await relayerRewardsPool.version()
  console.log(`RelayerRewardsPool version: ${version}`)

  // Register a relayer
  console.log("Registering a relayer...")
  await relayerRewardsPool.connect(deployer).registerRelayer(deployer.address)

  // Verify the relayer is registered
  const isRegistered = await relayerRewardsPool.isRegisteredRelayer(deployer.address)
  console.log(`${deployer.address} is now registered: ${isRegistered}`)

  console.log("================  RelayerRewardsPool deployment completed")
  console.log("================  Next steps:")
  console.log("================  1. Update config with RelayerRewardsPool address")
  console.log("================  2. Run XAllocationVoting v8 upgrade")
  console.log("================  3. Run VoterRewards v6 upgrade")

  process.exit(0)
}

main()
