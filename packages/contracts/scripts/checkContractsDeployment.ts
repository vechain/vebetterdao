import { ethers, network } from "hardhat"
import { deployAll } from "./deploy/deploy"
import { getConfig, Config } from "@repo/config"
import fs from "fs"
import path from "path"
import { seedLocalEnvironment } from "./deploy/seed"

const config = getConfig()

const isSoloNetwork = config.network.id === "solo"

async function main() {
  console.log(`Checking contracts deployment on ${network.name}...`)
  await checkContractsDeployment()
  process.exit(0)
}

// check if the contracts specified in the config file are deployed on the network, if not, deploy them (only on solo network)
async function checkContractsDeployment() {
  try {
    const code = await ethers.provider.getCode(config.b3trContractAddress)
    if (code === "0x") {
      console.log(`B3tr contract not deployed at address ${config.b3trContractAddress}`)
      if (isSoloNetwork) {
        // deploy the contracts and override the config file
        const newAddresses = await deployAll()
        try {
          await seedLocalEnvironment(
            newAddresses.b3tr,
            newAddresses.vot3,
            newAddresses.xAllocationPool,
            newAddresses.xAllocationVoting,
            newAddresses.emissions,
          )
        } catch (e) {
          console.error(e)
        }
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
    b3trContractAddress: await contracts.b3tr.getAddress(),
    vot3ContractAddress: await contracts.vot3.getAddress(),
    governorContractAddress: await contracts.governor.getAddress(),
    timelockContractAddress: await contracts.timelock.getAddress(),
    xAllocationPoolContractAddress: await contracts.xAllocationPool.getAddress(),
    xAllocationVotingContractAddress: await contracts.xAllocationVoting.getAddress(),
    emissionsContractAddress: await contracts.emissions.getAddress(),
  }

  // eslint-disable-next-line
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
