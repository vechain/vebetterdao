import { AppConfig, getConfig } from "@repo/config"
import { deployProxy } from "../../helpers"
import { EnvConfig, getContractsConfig } from "@repo/config/contracts"
import { NodeManagement } from "../../../typechain-types"
import path from "path"
import fs from "fs"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  const contractsConfig = getContractsConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log(`Deploying V1 of NodeManagement contract on network: ${config.network.name}`)

  console.log("--------------------------------------------------------")

  // Deploy NodeManagement
  const nodeManagement = (await deployProxy("NodeManagement", [
    contractsConfig.VECHAIN_NODES_CONTRACT_ADDRESS,
    contractsConfig.CONTRACTS_ADMIN_ADDRESS,
    contractsConfig.CONTRACTS_ADMIN_ADDRESS,
  ])) as NodeManagement

  console.log(`NodeManagement deployed at: ${await nodeManagement.getAddress()}`)

  // check that upgrade was successful
  const version = await nodeManagement.version()
  console.log(`NodeManagement version: ${version}`)

  console.log("--------------------------------------------------------")

  console.log(`Updating the config file with the new NodeManagement contract address`)
  try {
    await updateConfig(config, await nodeManagement.getAddress())
    console.log("Config file updated successfully")
  } catch (e) {
    console.error("Failed to update config file, update it manually")
  }

  console.log(`Update .../deploy_output/contracts.txt file with new NodeManagement contract address`)

  console.log("--------------------------------------------------------")

  console.log("Execution completed")
  process.exit(0)
}

async function updateConfig(config: AppConfig, nodeManagementContractAddress: string) {
  Object.assign(config, { nodeManagementContractAddress })

  const toWrite = `import { AppConfig } from \".\" \n const config: AppConfig = ${JSON.stringify(config, null, 2)};
    export default config;`

  let fileToWrite: string
  switch (config.network.name) {
    case "solo":
      fileToWrite = "local.ts"
      break
    case "solo-staging":
      fileToWrite = "solo-staging.ts"
      break
    case "testnet":
      fileToWrite = "testnet.ts"
      break
    case "main":
      fileToWrite = "mainnet.ts"
      break
    default:
      throw new Error("Invalid network name")
  }

  const localConfigPath = path.resolve(`../config/${fileToWrite}`)
  console.log(`Adding nodeManagementContractAddress to config file: ${localConfigPath}`)
  fs.writeFileSync(localConfigPath, toWrite)
}

// Execute the main function
main()
