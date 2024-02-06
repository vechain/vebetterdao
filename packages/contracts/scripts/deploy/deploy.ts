import { ethers, network } from "hardhat"
import { B3TR, GovernorContract, TimeLock, VOT3, XAllocationPool } from "../../typechain-types"

const DEFAULT_MINTER = "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68" //2nd account from mnemonic of solo network
const TIMELOCK_ADMIN = "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa" //1st account from mnemonic of solo network
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"
const NFT_BADGE_ADMIN = "0x0f872421dc479f3c11edd89512731814d0598db5" //3rd account from mnemonic of solo network
const XPOOL_ADMIN = "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa" //1st account from mnemonic of solo network

// Governor Values
const QUORUM_PERCENTAGE = 4 // 4 -> Need 4% of voters to pass
const MIN_DELAY = 3600 // blocks - after a vote passes, you have 1 hour before you can enact
const VOTING_PERIOD = 45818 // blocks - how long the vote lasts.
const VOTING_DELAY = 1 // How many blocks till a proposal vote becomes active
const PROPOSAL_THRESHOLD = 1 // How many votes are needed to create a proposal

// NFT Badge Values
const name = "B3TR Badge"
const symbol = "B3TR"

export async function deployAll() {
  console.log(`Deploying contracts on ${network.name}...`)

  // Deploy the contracts
  const b3tr = await deployB3trToken()
  const vot3 = await deployVot3Token(await b3tr.getAddress())

  // Deploy the governance contract
  const timelock = await deployTimeLock()
  const governor = await deployGovernor(await vot3.getAddress(), await timelock.getAddress())

  // Set proposer, canceller and executor role to timelock
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE()
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE()
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE()
  await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress())
  await timelock.grantRole(EXECUTOR_ROLE, await governor.getAddress())
  await timelock.grantRole(CANCELLER_ROLE, await governor.getAddress())

  // Deploy XAllocationPool
  const xAllocationPool = await deployXAllocationPool(timelock, XPOOL_ADMIN)

  // Deploy XAllocationVoting
  const xAllocationVoting = await deployXAllocationVoting(timelock, xAllocationPool, vot3, XPOOL_ADMIN)

  // Deploy the NFT Badge contract with Max Mintable Level 1
  const badge = await deployNFTBadge(1)

  return {
    governorAddress: await governor.getAddress(),
    timelockAddress: await timelock.getAddress(),
    b3trAddress: await b3tr.getAddress(),
    vot3Address: await vot3.getAddress(),
    badgeAddress: await badge.getAddress(),
    xAllocationPoolAddress: await xAllocationPool.getAddress(),
    xAllocationVotingAddress: await xAllocationVoting.getAddress(),
  }

  // close the script
}

async function deployB3trToken(): Promise<B3TR> {
  console.log(`Deploying B3tr contract`)
  const B3trContract = await ethers.getContractFactory("B3TR") // Use the global variable
  const contract = await B3trContract.deploy(DEFAULT_MINTER)

  await contract.waitForDeployment()

  console.log(`B3tr contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployVot3Token(b3trAddress: string): Promise<VOT3> {
  console.log(`Deploying Vot3 contract`)
  const Vot3Contract = await ethers.getContractFactory("VOT3") // Use the global variable
  const contract = await Vot3Contract.deploy(b3trAddress)

  await contract.waitForDeployment()

  console.log(`Vot3 contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployTimeLock(): Promise<TimeLock> {
  console.log(`Deploying TimeLock contract`)
  const TimeLockContract = await ethers.getContractFactory("TimeLock")
  const contract = await TimeLockContract.deploy(MIN_DELAY, [], [], TIMELOCK_ADMIN)

  await contract.waitForDeployment()

  console.log(`TimeLock contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployGovernor(vot3Address: string, timelockAddress: string): Promise<GovernorContract> {
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

  console.log(`Governor contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployNFTBadge(mintableLevelFromDeploy: number) {
  console.log(`Deploying B3TRBadge NFT contract`)
  const NFTBadgeContract = await ethers.getContractFactory("B3TRBadge")
  const contract = await NFTBadgeContract.deploy(name, symbol, NFT_BADGE_ADMIN, mintableLevelFromDeploy)

  await contract.waitForDeployment()

  console.log(`NFTBadge contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployXAllocationPool(timeLock: TimeLock, adminAddress: string) {
  console.log(`Deploying XAllocationPool contract`)
  const XAllocationPoolContract = await ethers.getContractFactory("XAllocationPool")
  const contract = await XAllocationPoolContract.deploy([await timeLock.getAddress(), adminAddress])

  await contract.waitForDeployment()

  console.log(`XAllocationPool contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployXAllocationVoting(
  timeLock: TimeLock,
  xAllocationPool: XAllocationPool,
  vot3: VOT3,
  adminAddress: string,
) {
  console.log(`Deploying XAllocationVoting contract`)
  const XAllocationVotingContract = await ethers.getContractFactory("XAllocationVoting")
  const contract = await XAllocationVotingContract.deploy(
    await vot3.getAddress(),
    QUORUM_PERCENTAGE,
    VOTING_PERIOD,
    0, // voting delay
    await timeLock.getAddress(),
    await xAllocationPool.getAddress(),
    [await timeLock.getAddress(), adminAddress],
  )

  await contract.waitForDeployment()

  console.log(`XAllocationVoting contract deployed at address ${await contract.getAddress()}`)

  return contract
}
