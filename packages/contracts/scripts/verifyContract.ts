import { ethers, network } from "hardhat"
import { run } from "hardhat"
import fetch from "node-fetch"

async function verifyContract() {
  const contractName = process.env.CONTRACT_NAME
  const deployedAddress = process.env.CONTRACT_ADDRESS

  if (!contractName || !deployedAddress) {
    throw new Error("CONTRACT_NAME and CONTRACT_ADDRESS environment variables are required")
  }

  // First, get the bytecode from mainnet using VeChain's API
  const mainnetResponse = await fetch(`https://mainnet.vechain.org/accounts/${deployedAddress}/code`)
  if (!mainnetResponse.ok) {
    throw new Error(`Failed to fetch code from mainnet: ${mainnetResponse.statusText}`)
  }
  const mainnetData = await mainnetResponse.json()
  const mainnetCode = mainnetData.code
  const mainnetCodeNoMeta = mainnetCode.slice(0, -86) // Remove metadata

  // Then deploy on Hardhat network
  const B3trContract = await ethers.getContractFactory("B3TR")
  const [deployer] = await ethers.getSigners()
  const hardhatContract = await B3trContract.deploy(
    deployer.address, // admin
    deployer.address, // minter
    deployer.address, // pauser
  )
  await hardhatContract.waitForDeployment()

  // Get deployed contract bytecode from Hardhat network
  const hardhatDeployedCode = await ethers.provider.getCode(await hardhatContract.getAddress())
  const hardhatDeployedCodeNoMeta = hardhatDeployedCode.slice(0, -86) // Remove metadata

  console.log(`\nVerifying ${contractName} at ${deployedAddress}`)

  // Compare bytecodes
  console.log("\nBytecode comparison:")
  console.log("Thor deployed:", mainnetCodeNoMeta)
  console.log("Hardhat deployed:", hardhatDeployedCodeNoMeta)

  if (mainnetCodeNoMeta === hardhatDeployedCodeNoMeta) {
    console.log("\n✅ Bytecode matches!")
  } else {
    console.log("\n❌ Bytecode does not match!")
    process.exit(1)
  }
}

verifyContract()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
