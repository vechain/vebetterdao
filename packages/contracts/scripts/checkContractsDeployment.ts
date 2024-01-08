import { ethers, network } from "hardhat"
import { deployAll } from "./deploy/deploy"
import { config, Config } from "@repo/config"
import fs from "fs"
import path from "path"

const { b3trContractAddress } = config

const isSoloNetwork = config.network.id === "solo"

async function main() {
  console.log(`Checking contracts deployment on ${network.name}...`)
  await checkContractsDeployment()
  process.exit(0)
}

// check if the contracts specified in the config file are deployed on the network, if not, deploy them (only on solo network)
async function checkContractsDeployment() {
  try {
    const code = await ethers.provider.getCode(b3trContractAddress)
    if (code === "0x") {
      console.log(`B3tr contract not deployed at address ${b3trContractAddress}`)
      if (isSoloNetwork) {
        // deploy the contracts and override the config file
        const newAddresses = await deployAll()
        return await overrideLocalConfigWithNewContracts(newAddresses)
      } else console.log(`Skipping deployment on ${network.name}`)
    } else console.log(`B3tr contract already deployed`)
  } catch (e) {
    console.log(e)
  }
}

async function overrideLocalConfigWithNewContracts(contracts: Awaited<ReturnType<typeof deployAll>>) {
  const newConfig: Config = {
    ...config,
    b3trContractAddress: contracts.b3trAddress,
    vot3ContractAddress: contracts.vot3Address,
    governorContractAddress: contracts.governorAddress,
    timelockContractAddress: contracts.timelockAddress,
  }

  const toWrite = `import { Config } from \".\" \n export const localConfig: Config = ${JSON.stringify(
    newConfig,
    null,
    2,
  )}`

  const localConfigPath = path.resolve("../config/local.ts")
  console.log(`Writing new config file to ${localConfigPath}`)
  fs.writeFileSync(localConfigPath, toWrite)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exit(1)
})
