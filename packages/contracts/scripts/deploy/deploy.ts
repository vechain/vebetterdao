import { ethers, network } from "hardhat"
import { B3TR, B3TRGovernor, TimeLock, VOT3 } from "../../typechain-types"

const DEFAULT_MINTER = "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68" //2nd account from mnemonic of solo network
const TIMELOCK_ADMIN = "0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa" //1st account from mnemonic of solo network
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

// Emissions Values
const VOTE_2_EARN_ADDRESS = "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68" //2nd account from mnemonic of solo network
const TREASURY_ADDRESS = "0x0f872421dc479f3c11edd89512731814d0598db5" //3rd account from mnemonic of solo network

const PRE_MINT_X_ALLOCATION = ethers.parseEther("1000000")
const PRE_MINT_VOTE_2_EARN_ALLOCATION = ethers.parseEther("1000000")
const PRE_MINT_TREASURY_ALLOCATION = ethers.parseEther("1750000")

const CYCLE_DURATION = 60480 // 1 Week in blocks
const DECAY_SETTINGS = [4, 20, 12, 50] // 4% decay for X Allocations, 20% decay for Vote2Earn, every 12 cycles for X Allocations, Every 50 cycles for Vote2Earn
const INITIAL_EMISSIONS = ethers.parseEther("2000000")
const TREASURY_PERCENTAGE = 25 // 25%
const MAX_VOTE_2_EARN_DECAY_PERCENTAGE = 80 // 80%

// XAllocationPool Values
const BASE_ALLOCATION_PERCENTAGE = 20
const APP_SHARES_CAP = 15

// Voter rewards
const levels = [1]
const multiplier = [0]

export async function deployAll() {
  console.log(`Deploying contracts on ${network.name}...`)

  const [timelockAdminSigner, defaultMinter, nftBadgeAdmin] = await ethers.getSigners()

  // Deploy B3TR and VOT3 tokens
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
  const xAllocationPool = await deployXAllocationPool(b3tr, XPOOL_ADMIN, BASE_ALLOCATION_PERCENTAGE, APP_SHARES_CAP)

  // Deploy the NFT Badge contract with Max Mintable Level 1
  const badge = await deployNFTBadge(1)

  const emissions = await deployEmissions(
    await b3tr.getAddress(),
    [await xAllocationPool.getAddress(), VOTE_2_EARN_ADDRESS, TREASURY_ADDRESS],
    [PRE_MINT_X_ALLOCATION, PRE_MINT_VOTE_2_EARN_ALLOCATION, PRE_MINT_TREASURY_ALLOCATION],
  )

  const voterRewards = await deployVoterRewards(
    await badge.getAddress(),
    await emissions.getAddress(),
    await b3tr.getAddress(),
  )

  // Deploy XAllocationVoting
  const xAllocationVoting = await deployXAllocationVoting(timelock, vot3, XPOOL_ADMIN, await voterRewards.getAddress())

  // Grant Vote Registrar role to XAllocationVoting
  await voterRewards.connect(timelockAdminSigner).setXallocationVoteRegistrarRole(await xAllocationVoting.getAddress())

  // Grant admin role to voter rewards for registering x allocation voting
  await xAllocationVoting.connect(timelockAdminSigner).setAdminRole(await emissions.getAddress())

  // Set X allocations governor
  await emissions.connect(timelockAdminSigner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
  // Setup XAllocationPool addresses
  await xAllocationPool.connect(timelockAdminSigner).setXAllocationVotingAddress(await xAllocationVoting.getAddress())
  await xAllocationPool.connect(timelockAdminSigner).setEmissionsAddress(await emissions.getAddress())

  // Set xAllocationVoting and B3TRGovernor address in B3TRBedge
  await badge.connect(nftBadgeAdmin).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
  await badge.connect(nftBadgeAdmin).setB3trGovernorAddress(await governor.getAddress())

  return {
    governor: governor,
    timelock: timelock,
    b3tr: b3tr,
    vot3: vot3,
    badge: badge,
    xAllocationPool: xAllocationPool,
    xAllocationVoting: xAllocationVoting,
    emissions: emissions,
    voterRewards: voterRewards,
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

async function deployGovernor(vot3Address: string, timelockAddress: string): Promise<B3TRGovernor> {
  console.log(`Deploying Governor contract`)
  const B3TRGovernor = await ethers.getContractFactory("B3TRGovernor")
  const contract = await B3TRGovernor.deploy(
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

async function deployXAllocationPool(
  b3tr: B3TR,
  adminAddress: string,
  baseAllocationPercentage: number = 20,
  appSharesCap: number = 15,
) {
  console.log(`Deploying XAllocationPool contract`)
  const XAllocationPoolContract = await ethers.getContractFactory("XAllocationPool")
  const contract = await XAllocationPoolContract.deploy(
    adminAddress,
    await b3tr.getAddress(),
    baseAllocationPercentage,
    appSharesCap,
  )

  await contract.waitForDeployment()

  console.log(`XAllocationPool contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployXAllocationVoting(
  timeLock: TimeLock,
  vot3: VOT3,
  adminAddress: string,
  voterRewardsAddress: string,
) {
  console.log(`Deploying XAllocationVoting contract`)
  const XAllocationVotingContract = await ethers.getContractFactory("XAllocationVoting")
  const contract = await XAllocationVotingContract.deploy(
    await vot3.getAddress(),
    QUORUM_PERCENTAGE,
    VOTING_PERIOD,
    await timeLock.getAddress(),
    voterRewardsAddress,
    [await timeLock.getAddress(), adminAddress],
  )

  await contract.waitForDeployment()

  console.log(`XAllocationVoting contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployEmissions(b3trAddress: string, destinations: string[], allocations: bigint[]) {
  console.log(`Deploying Emissions contract`)
  const EmissionsContract = await ethers.getContractFactory("Emissions")
  const contract = await EmissionsContract.deploy(
    DEFAULT_MINTER,
    TIMELOCK_ADMIN,
    b3trAddress,
    destinations as [string, string, string],
    allocations as [bigint, bigint, bigint],
    CYCLE_DURATION,
    DECAY_SETTINGS as [number, number, number, number],
    INITIAL_EMISSIONS,
    TREASURY_PERCENTAGE,
    MAX_VOTE_2_EARN_DECAY_PERCENTAGE
  )

  await contract.waitForDeployment()

  console.log(`Emissions contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployVoterRewards(badgeAddress: string, emissionsAddress: string, b3trAddress: string) {
  console.log(`Deploying VoterRewards contract`)
  const VoterRewardsContract = await ethers.getContractFactory("VoterRewards")
  const contract = await VoterRewardsContract.deploy(
    TIMELOCK_ADMIN,
    emissionsAddress,
    badgeAddress,
    b3trAddress,
    levels,
    multiplier,
  )

  await contract.waitForDeployment()

  console.log(`VoterRewards contract deployed at address ${await contract.getAddress()}`)

  return contract
}
