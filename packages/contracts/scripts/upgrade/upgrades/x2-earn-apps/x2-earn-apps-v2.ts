import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig, getContractsConfig } from "@repo/config/contracts"
import { X2EarnApps } from "../../../../typechain-types"
import { ethers } from "hardhat"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  const contractsConfig = getContractsConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log(
    `Upgrading X2EarnApps contract at address: ${config.voterRewardsContractAddress} on network: ${config.network.name}`,
  )

  // Check if the node management contract is deployed
  if (!config.nodeManagementContractAddress) {
    throw new Error("NodeManagement contract not deployed, please deploy it first")
  }

  const nodeManagementContract = await ethers.getContractAt("NodeManagement", config.nodeManagementContractAddress)
  try {
    await nodeManagementContract.version()
  } catch (e) {
    throw new Error("NodeManagement contract is not deployed")
  }

  const x2EarnAppsV2 = (await upgradeProxy(
    "X2EarnAppsV1",
    "X2EarnApps",
    config.x2EarnAppsContractAddress,
    [contractsConfig.XAPP_GRACE_PERIOD, config.nodeManagementContractAddress],
    {
      version: 2,
    },
  )) as X2EarnApps

  console.log(`X2EarnApps upgraded`)

  // check that upgrade was successful
  const version = await x2EarnAppsV2.version()
  console.log(`New X2EarnApps version: ${version}`)

  if (parseInt(version) !== 2) {
    throw new Error(`X2EarnApps version is not 2: ${version}`)
  }

  console.log("Execution completed")
  process.exit(0)
}

// Execute the main function
main()
