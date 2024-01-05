import { ethers, network } from "hardhat"
import * as deploy from "./deploy"

const B3TR_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS

const checkContractsDeployment = async () => {
  try {
    if (!B3TR_CONTRACT_ADDRESS) throw new Error("NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS is not set")
    const code = await ethers.provider.getCode(B3TR_CONTRACT_ADDRESS)
    if (code === "0x") {
      console.log(`B3tr contract not deployed at address ${B3TR_CONTRACT_ADDRESS}`)
      await deploy.main()
    } else console.log(`B3tr contract already deployed`)
  } catch (e) {
    console.log(e)
  }
}

const main = async () => {
  console.log(`Checking contracts deployment on ${network.name}...`)
  await checkContractsDeployment()
  process.exit(0)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
