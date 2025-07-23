import { getConfig } from "@repo/config"
import { deployProxy } from "../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { ethers } from "hardhat"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  const deployer = (await ethers.getSigners())[0]

  console.log(
    `================  Deploying contracts on ${config.network.name} (${config.nodeUrl}) with ${config.environment} configurations `,
  )
  console.log(`================  Address used to deploy: ${deployer.address}`)

  console.log(`Deploying VeBetterRoundStarter contract`)

  // Deploy
  const VeBetterRoundStarter = await deployProxy("VeBetterRoundStarter", [
    config.xAllocationPoolContractAddress,
    config.xAllocationVotingContractAddress,
    config.x2EarnAppsContractAddress,
    config.emissionsContractAddress,
  ])

  console.log(`VeBetterRoundStarter deployed at: ${await VeBetterRoundStarter.getAddress()}`)

  console.log("================================================================================")

  console.log("Execution completed")
  process.exit(0)
}

// Execute the main function
main()
