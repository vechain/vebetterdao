import { ethers, network } from "hardhat"

const DEFAULT_MINTER = "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68"
const TIMELOCK_ADMIN = "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68"
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

// Governor Values
const QUORUM_PERCENTAGE = 4 // 4 -> Need 4% of voters to pass
const MIN_DELAY = 3600 // blocks - after a vote passes, you have 1 hour before you can enact
const VOTING_PERIOD = 45818 // blocks - how long the vote lasts.
const VOTING_DELAY = 1 // How many blocks till a proposal vote becomes active
const PROPOSAL_THRESHOLD = 1 // How many votes are needed to create a proposal

async function main() {
  console.log(`Deploying contracts on ${network.name}...`)

  // Deploy the contracts
  const b3trAddress = await deployB3trToken()
  const vot3Address = await deployVot3Token(b3trAddress)

  // Deploy the governance contract
  const timelockAddress = await deployTimeLock()
  await deployGovernor(vot3Address, timelockAddress)

  // close the script
  process.exit(0)
}

async function deployB3trToken(): Promise<string> {
  console.log(`Deploying B3tr contract`)
  const B3trContract = await ethers.getContractFactory("B3TR") // Use the global variable
  const contract = await B3trContract.deploy(DEFAULT_MINTER)

  await contract.waitForDeployment()

  const address = await contract.getAddress()

  console.log(`B3tr contract deployed at address ${address}`)

  return address
}

async function deployVot3Token(b3trAddress: string): Promise<string> {
  console.log(`Deploying Vot3 contract`)
  const Vot3Contract = await ethers.getContractFactory("VOT3") // Use the global variable
  const contract = await Vot3Contract.deploy(b3trAddress)

  await contract.waitForDeployment()

  const address = await contract.getAddress()

  console.log(`Vot3 contract deployed at address ${address}`)

  return address
}

async function deployTimeLock(): Promise<string> {
  console.log(`Deploying TimeLock contract`)
  const TimeLockContract = await ethers.getContractFactory("TimeLock")
  const contract = await TimeLockContract.deploy(
    MIN_DELAY,
    [],
    [],
    TIMELOCK_ADMIN,
  )

  await contract.waitForDeployment()

  const address = await contract.getAddress()

  console.log(`TimeLock contract deployed at address ${address}`)

  return address
}

async function deployGovernor(
  vot3Address: string,
  timelockAddress: string,
): Promise<string> {
  console.log(`Deploying Governor contract`)
  const GovernorContract = await ethers.getContractFactory("GovernorContract")
  const contract = await GovernorContract.deploy(
    vot3Address,
    timelockAddress,
    QUORUM_PERCENTAGE,
    VOTING_PERIOD,
    VOTING_DELAY,
    PROPOSAL_THRESHOLD,
  )

  await contract.waitForDeployment()

  const address = await contract.getAddress()

  console.log(`Governor contract deployed at address ${address}`)

  return address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error)
  process.exit(1)
})
