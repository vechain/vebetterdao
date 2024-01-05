import { ethers, network } from "hardhat"
import { deployAll } from "./deploy/deploy"
import { config } from "@repo/config"

const { b3trContractAddress } = config

async function main() {
  console.log(`Checking contracts deployment on ${network.name}...`)
  await checkContractsDeployment()
  process.exit(0)
}

async function checkContractsDeployment() {
  try {
    const code = await ethers.provider.getCode(b3trContractAddress)
    if (code === "0x") {
      console.log(`B3tr contract not deployed at address ${b3trContractAddress}`)
      await deployAll()
    } else console.log(`B3tr contract already deployed`)
  } catch (e) {
    console.log(e)
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exit(1)
})
