import { ethers, network } from "hardhat"
import { B3TR, B3TRGovernor, TimeLock, VOT3 } from "../../typechain-types"
import { contractsConfig } from "@repo/config/contracts"

const ADMIN = contractsConfig.CONTRACTS_ADMIN_ADDRESS

// Governor Values
const QUORUM_PERCENTAGE = contractsConfig.B3TR_GOVERNOR_QUORUM_PERCENTAGE
const MIN_DELAY = contractsConfig.B3TR_GOVERNOR_MIN_DELAY
const VOTING_PERIOD = contractsConfig.B3TR_GOVERNOR_VOTING_PERIOD
const VOTING_DELAY = contractsConfig.B3TR_GOVERNOR_VOTING_DELAY
const PROPOSAL_THRESHOLD = contractsConfig.B3TR_GOVERNOR_PROPOSAL_THRESHOLD

// Emissions Values
const VOTE_2_EARN_ADDRESS = contractsConfig.VOTE_2_EARN_POOL_ADDRESS
const TREASURY_ADDRESS = contractsConfig.TREASURY_POOL_ADDRESS

const INITIAL_X_ALLOCATION = ethers.parseEther(contractsConfig.INITIAL_X_ALLOCATION.toString())
const INITIAL_VOTE_2_EARN_ALLOCATION = ethers.parseEther(contractsConfig.INITIAL_VOTE_2_EARN_ALLOCATION.toString())
const INITIAL_TREASURY_ALLOCATION = ethers.parseEther(contractsConfig.INITIAL_TREASURY_ALLOCATION.toString())

const CYCLE_DURATION = contractsConfig.EMISSIONS_CYCLE_DURATION
const DECAY_SETTINGS = [
  contractsConfig.EMISSIONS_X_ALLOCATION_DECAY_PERCENTAGE,
  contractsConfig.EMISSIONS_VOTE_2_EARN_DECAY_PERCENTAGE,
  contractsConfig.EMISSIONS_X_ALLOCATION_DECAY_PERIOD,
  contractsConfig.EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD,
]
const INITIAL_EMISSIONS = ethers.parseEther(contractsConfig.EMISSIONS_INITIAL_EMISSIONS.toString())
const TREASURY_PERCENTAGE = contractsConfig.EMISSIONS_TREASURY_PERCENTAGE
const MAX_VOTE_2_EARN_DECAY_PERCENTAGE = contractsConfig.EMISSIONS_MAX_VOTE_2_EARN_DECAY_PERCENTAGE

// XAllocationVoting Values
const X_ALLOCATION_VOTING_PERIOD = CYCLE_DURATION - 1

// XAllocationPool Values
const BASE_ALLOCATION_PERCENTAGE = contractsConfig.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE
const APP_SHARES_CAP = contractsConfig.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP

// NFT Badge Values
const name = "B3TR Badge"
const symbol = "B3TR"
const BASE_URI = contractsConfig.BASE_URI

// Voter rewards
const levels = [1]
const multiplier = [0]

export async function deployAll() {
  console.log(`Deploying contracts on ${network.name} with ${contractsConfig.NEXT_PUBLIC_APP_ENV} configurations...`)

  const [admin] = await ethers.getSigners()

  // Deploy B3TR and VOT3 tokens
  const b3tr = await deployB3trToken(ADMIN)
  const vot3 = await deployVot3Token(await b3tr.getAddress())

  // Deploy the governance contract
  const timelock = await deployTimeLock(MIN_DELAY, ADMIN)
  const governor = await deployGovernor(
    await vot3.getAddress(),
    await timelock.getAddress(),
    QUORUM_PERCENTAGE,
    VOTING_PERIOD,
    VOTING_DELAY,
    PROPOSAL_THRESHOLD,
  )

  // Set proposer, canceller and executor role to timelock
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE()
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE()
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE()
  await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress())
  await timelock.grantRole(EXECUTOR_ROLE, await governor.getAddress())
  await timelock.grantRole(CANCELLER_ROLE, await governor.getAddress())

  // Deploy XAllocationPool
  const xAllocationPool = await deployXAllocationPool(
    await b3tr.getAddress(),
    ADMIN,
    BASE_ALLOCATION_PERCENTAGE,
    APP_SHARES_CAP,
  )

  // Deploy the NFT Badge contract with Max Mintable Level 1
  const badge = await deployNFTBadge(1, name, symbol, ADMIN)

  const emissions = await deployEmissions(
    await b3tr.getAddress(),
    [await xAllocationPool.getAddress(), VOTE_2_EARN_ADDRESS, TREASURY_ADDRESS],
    [INITIAL_X_ALLOCATION, INITIAL_VOTE_2_EARN_ALLOCATION, INITIAL_TREASURY_ALLOCATION],
    ADMIN,
    ADMIN,
    CYCLE_DURATION,
    DECAY_SETTINGS as [number, number, number, number],
    INITIAL_EMISSIONS,
    TREASURY_PERCENTAGE,
    MAX_VOTE_2_EARN_DECAY_PERCENTAGE,
  )

  const voterRewards = await deployVoterRewards(
    await badge.getAddress(),
    await emissions.getAddress(),
    await b3tr.getAddress(),
    ADMIN,
    levels,
    multiplier,
  )

  // Deploy XAllocationVoting
  const xAllocationVoting = await deployXAllocationVoting(
    await timelock.getAddress(),
    await vot3.getAddress(),
    ADMIN,
    await voterRewards.getAddress(),
    QUORUM_PERCENTAGE,
    X_ALLOCATION_VOTING_PERIOD,
  )

  // Grant Vote Registrar role to XAllocationVoting
  await voterRewards.connect(admin).setXallocationVoteRegistrarRole(await xAllocationVoting.getAddress())

  // Grant admin role to voter rewards for registering x allocation voting
  await xAllocationVoting.connect(admin).setAdminRole(await emissions.getAddress())

  // Set X allocations governor
  await emissions.connect(admin).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
  // Setup XAllocationPool addresses
  await xAllocationPool.connect(admin).setXAllocationVotingAddress(await xAllocationVoting.getAddress())
  await xAllocationPool.connect(admin).setEmissionsAddress(await emissions.getAddress())

  // Set xAllocationVoting and B3TRGovernor address in B3TRBedge
  await badge.connect(admin).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
  await badge.connect(admin).setB3trGovernorAddress(await governor.getAddress())

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

async function deployB3trToken(admin: string): Promise<B3TR> {
  console.log(`Deploying B3tr contract`)
  const B3trContract = await ethers.getContractFactory("B3TR") // Use the global variable
  const contract = await B3trContract.deploy(admin)

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

async function deployTimeLock(
  minDelay: number,
  admin: string,
  proposers: string[] = [],
  executors: string[] = [],
): Promise<TimeLock> {
  console.log(`Deploying TimeLock contract`)
  const TimeLockContract = await ethers.getContractFactory("TimeLock")
  const contract = await TimeLockContract.deploy(minDelay, proposers, executors, admin)

  await contract.waitForDeployment()

  console.log(`TimeLock contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployGovernor(
  vot3Address: string,
  timelockAddress: string,
  quorum: number,
  votingPeriod: number,
  votingDelay: number,
  proposalThreshold: number,
): Promise<B3TRGovernor> {
  console.log(`Deploying Governor contract`)
  const B3TRGovernor = await ethers.getContractFactory("B3TRGovernor")
  const contract = await B3TRGovernor.deploy(
    vot3Address,
    timelockAddress,
    quorum,
    votingPeriod,
    votingDelay,
    proposalThreshold,
  )

  await contract.waitForDeployment()

  console.log(`Governor contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployNFTBadge(mintableLevelFromDeploy: number, name: string, symbol: string, admin: string) {
  console.log(`Deploying B3TRBadge NFT contract`)
  const NFTBadgeContract = await ethers.getContractFactory("B3TRBadge")
  const contract = await NFTBadgeContract.deploy(name, symbol, admin, mintableLevelFromDeploy, BASE_URI)

  await contract.waitForDeployment()

  console.log(`NFTBadge contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployXAllocationPool(
  b3trAddress: string,
  adminAddress: string,
  baseAllocationPercentage: number = 20,
  appSharesCap: number = 15,
) {
  console.log(`Deploying XAllocationPool contract`)
  const XAllocationPoolContract = await ethers.getContractFactory("XAllocationPool")
  const contract = await XAllocationPoolContract.deploy(
    adminAddress,
    b3trAddress,
    baseAllocationPercentage,
    appSharesCap,
  )

  await contract.waitForDeployment()

  console.log(`XAllocationPool contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployXAllocationVoting(
  timeLockAddress: string,
  vot3Address: string,
  adminAddress: string,
  voterRewardsAddress: string,
  quorumPercentage: number = 50,
  xAllocationVotingPeriod: number = 10,
) {
  console.log(`Deploying XAllocationVoting contract`)
  const XAllocationVotingContract = await ethers.getContractFactory("XAllocationVoting")
  const contract = await XAllocationVotingContract.deploy(
    vot3Address,
    quorumPercentage,
    xAllocationVotingPeriod,
    timeLockAddress,
    voterRewardsAddress,
    [timeLockAddress, adminAddress],
  )

  await contract.waitForDeployment()

  console.log(`XAllocationVoting contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployEmissions(
  b3trAddress: string,
  destinations: string[],
  allocations: bigint[],
  minterAddress: string,
  adminAddress: string,
  cycleDuration: number,
  decaySettings: [number, number, number, number],
  initialEmissions: bigint,
  treasuryPercentage: number,
  maxVote2EarnDecayPercentage: number,
) {
  console.log(`Deploying Emissions contract`)
  const EmissionsContract = await ethers.getContractFactory("Emissions")
  const contract = await EmissionsContract.deploy(
    minterAddress,
    adminAddress,
    b3trAddress,
    destinations as [string, string, string],
    allocations as [bigint, bigint, bigint],
    cycleDuration,
    decaySettings as [number, number, number, number],
    initialEmissions,
    treasuryPercentage,
    maxVote2EarnDecayPercentage,
  )

  await contract.waitForDeployment()

  console.log(`Emissions contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployVoterRewards(
  badgeAddress: string,
  emissionsAddress: string,
  b3trAddress: string,
  adminAddress: string,
  levels: number[],
  multiplier: number[],
) {
  console.log(`Deploying VoterRewards contract`)
  const VoterRewardsContract = await ethers.getContractFactory("VoterRewards")
  const contract = await VoterRewardsContract.deploy(
    adminAddress,
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
