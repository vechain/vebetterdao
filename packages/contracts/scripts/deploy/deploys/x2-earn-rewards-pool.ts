import { getConfig } from "@repo/config"
import { EnvConfig, getContractsConfig } from "@repo/config/contracts"
import { deployProxy } from "../../helpers"
import { X2EarnRewardsPool } from "../../../typechain-types"
import { ethers } from "hardhat"
import { updateConfig } from "../../helpers/config"

export async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const envConfig = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const contractsConfig = getContractsConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const deployer = (await ethers.getSigners())[0]

  // access to contracts address
  const b3trAddress = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig).b3trContractAddress
  const x2EarnAppsAddress = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig).x2EarnAppsContractAddress

  console.log(
    `================  Deploying contracts on ${envConfig.network.name} (${envConfig.nodeUrl}) with ${envConfig.environment} configurations `,
  )
  console.log(`================  Address used to deploy: ${deployer.address}`)

  // We use a temporary admin to deploy and initialize contracts then transfer role to the real admin
  // Also we have many roles in our contracts but we currently use one wallet for all roles
  const TEMP_ADMIN = envConfig.network.name === "solo" ? contractsConfig.CONTRACTS_ADMIN_ADDRESS : deployer.address
  console.log("================================================================================")
  console.log("Temporary admin set to ", TEMP_ADMIN)
  console.log("Final admin will be set to ", contractsConfig.CONTRACTS_ADMIN_ADDRESS)
  console.log("================================================================================")

  console.log("Deploying proxy for X2EarnRewardsPool")

  // Deploy X2EarnRewardsPool needs address _admin, address _contractsManagerAdmin, address _upgrader, IB3TR _b3tr, IX2EarnApps _x2EarnApps
  const x2EarnRewardsPool = (await deployProxy("X2EarnRewardsPool", [
    contractsConfig.CONTRACTS_ADMIN_ADDRESS, // _admin
    contractsConfig.CONTRACTS_ADMIN_ADDRESS, // _contractsManagerAdmin
    TEMP_ADMIN, // _upgrader
    b3trAddress, // _b3tr
    x2EarnAppsAddress, // _x2EarnApps
  ])) as X2EarnRewardsPool

  console.log(`X2EarnRewardsPool deployed at: ${await x2EarnRewardsPool.getAddress()}`)

  // check that upgrade was succefull
  const version = await x2EarnRewardsPool.version()
  console.log(`New X2EarnRewardsPool version: ${version}`)

  console.log("================================================================================")
  console.log(`Updating the config file with the new address of the X2EarnRewardsPool contract`)
  try {
    Object.assign(envConfig, {
      x2EarnRewardsPoolContractAddress: await x2EarnRewardsPool.getAddress(),
    })
    await updateConfig(envConfig, "x2EarnRewardsPoolContractAddress")
    console.log("Updated the config file with the new address of the X2EarnRewardsPool contract")
  } catch (error) {
    console.log("Failed to update the config file with the new address of the X2EarnRewardsPool contract")
  }
  console.log(`Update .../deploy_output/contracts.txt file with new X2EarnRewardsPool contract address`)

  console.log("================================================================================")

  console.log("Execution completed")
  process.exit(0)
}

main()
