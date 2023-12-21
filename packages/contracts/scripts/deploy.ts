import { ethers, network } from "hardhat"

const DEFAULT_MINTER = "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68"

async function main() {
  console.log(`Deploying contracts on ${network.name}...`)

  // Deploy the contracts
  const b3trAddress = await deployB3trToken()
  await deployVot3Token(b3trAddress)

  // close the script
  process.exit(0)
}

async function deployB3trToken(): Promise<string> {
  const B3trContract = await ethers.getContractFactory("B3TR") // Use the global variable
  const contract = await B3trContract.deploy(DEFAULT_MINTER)

  await contract.waitForDeployment()

  const address = await contract.getAddress()

  console.log(`B3tr contract deployed at address ${address}`)

  return address
}

async function deployVot3Token(b3trAddress: string): Promise<string> {
  const Vot3Contract = await ethers.getContractFactory("VOT3") // Use the global variable
  const contract = await Vot3Contract.deploy(b3trAddress)

  await contract.waitForDeployment()

  const address = await contract.getAddress()

  console.log(`Vot3 contract deployed at address ${address}`)

  return address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exit(1)
})
