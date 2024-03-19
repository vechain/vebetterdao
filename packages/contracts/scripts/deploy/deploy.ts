import { ethers, network } from "hardhat"
import {
  B3TR,
  Emissions,
  VOT3,
  XAllocationVoting,
  TimeLock,
  B3TRGovernor,
  B3TRBadge,
  VoterRewards,
  XAllocationPool,
} from "../../typechain-types"
import { ContractsConfig } from "@repo/config/contracts/type"
import { HttpNetworkConfig } from "hardhat/types"
import { seedLocalEnvironment, seedTestEnvironment } from "./seed"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { deployProxy } from "../helpers"

// NFT Badge Values
const name = "VeBetterDAO Galaxy Member"
const symbol = "GM"

// Voter rewards
const levels = [1]
const multiplier = [0]

export async function deployAll(config: ContractsConfig) {
  const networkConfig = network.config as HttpNetworkConfig
  console.log(
    `Deploying contracts on ${network.name} (${networkConfig.url}) with ${config.NEXT_PUBLIC_APP_ENV} configurations...`,
  )
  const [admin] = await ethers.getSigners()

  // We use a temporary admin to deploy and initialize contracts then transfer role to the real admin
  const TEMP_ADMIN = network.name === "vechain_solo" ? config.CONTRACTS_ADMIN_ADDRESS : admin.address
  console.log("Temporary admin set to ", TEMP_ADMIN)

  // ---------- Contracts Deployment ---------- //

  // Deploy B3TR and VOT3 tokens
  const b3tr = await deployB3trToken(TEMP_ADMIN, config.B3TR_CAP)
  const vot3 = await deployVot3Token(TEMP_ADMIN, await b3tr.getAddress())

  // Deploy the governance contract
  const timelock = await deployTimeLock(config.B3TR_GOVERNOR_MIN_DELAY, TEMP_ADMIN)
  const governor = await deployGovernor(
    await vot3.getAddress(),
    await timelock.getAddress(),
    config.B3TR_GOVERNOR_QUORUM_PERCENTAGE,
    config.B3TR_GOVERNOR_VOTING_PERIOD,
    config.B3TR_GOVERNOR_VOTING_DELAY,
    config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD,
  )

  // Deploy XAllocationPool
  const xAllocationPool = await deployXAllocationPool(
    await b3tr.getAddress(),
    TEMP_ADMIN,
    config.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE,
    config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP,
  )

  // Deploy the NFT Badge contract with Max Mintable Level 1
  const badge = await deployNFTBadge(1, name, symbol, TEMP_ADMIN, config.NFT_BADGE_BASE_URI)

  const emissions = await deployEmissions(
    await b3tr.getAddress(),
    [await xAllocationPool.getAddress(), config.VOTE_2_EARN_POOL_ADDRESS, config.TREASURY_POOL_ADDRESS],
    config.INITIAL_X_ALLOCATION,
    TEMP_ADMIN,
    TEMP_ADMIN,
    config.EMISSIONS_CYCLE_DURATION,
    [
      config.EMISSIONS_X_ALLOCATION_DECAY_PERCENTAGE,
      config.EMISSIONS_VOTE_2_EARN_DECAY_PERCENTAGE,
      config.EMISSIONS_X_ALLOCATION_DECAY_PERIOD,
      config.EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD,
    ],
    config.EMISSIONS_TREASURY_PERCENTAGE,
    config.EMISSIONS_MAX_VOTE_2_EARN_DECAY_PERCENTAGE,
  )

  const voterRewards = await deployVoterRewards(
    await badge.getAddress(),
    await emissions.getAddress(),
    await b3tr.getAddress(),
    TEMP_ADMIN,
    levels,
    multiplier,
  )

  // Deploy XAllocationVoting
  const xAllocationVoting = await deployXAllocationVoting(
    await timelock.getAddress(),
    await vot3.getAddress(),
    TEMP_ADMIN,
    await voterRewards.getAddress(),
    config.X_ALLOCATION_VOTING_QUORUM_PERCENTAGE,
    config.EMISSIONS_CYCLE_DURATION - 1,
    config.XAPP_BASE_URI,
  )

  console.log("Contracts deployed")

  // ---------- Contracts set up ---------- //

  console.log("Setting up contracts...")
  // Grant MINTER_ROLE on B3TR to emissions contract so it can bootstrap and distribute
  await b3tr.grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress()).then(async tx => await tx.wait())

  // Set proposer, canceller and executor role to timelock
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE()
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE()
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE()
  await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress())
  await timelock.grantRole(EXECUTOR_ROLE, await governor.getAddress())
  await timelock.grantRole(CANCELLER_ROLE, await governor.getAddress())

  // Grant Vote Registrar role to XAllocationVoting
  await voterRewards
    .connect(admin)
    .setXallocationVoteRegistrarRole(await xAllocationVoting.getAddress())
    .then(async tx => await tx.wait())

  // Emissions contract should be able to start new rounds
  await xAllocationVoting
    .connect(admin)
    .setAdminRole(await emissions.getAddress())
    .then(async tx => await tx.wait())

  // Set X allocations governor
  await emissions
    .connect(admin)
    .setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
    .then(async tx => await tx.wait())
  // Set voter rewards address in emissions
  await emissions
    .connect(admin)
    .setVote2EarnAddress(await voterRewards.getAddress())
    .then(async tx => await tx.wait())

  // Setup XAllocationPool addresses
  await xAllocationPool
    .connect(admin)
    .setXAllocationVotingAddress(await xAllocationVoting.getAddress())
    .then(async tx => await tx.wait())
  await xAllocationPool
    .connect(admin)
    .setEmissionsAddress(await emissions.getAddress())
    .then(async tx => await tx.wait())

  // Set xAllocationVoting and B3TRGovernor address in B3TRBadge
  await badge
    .connect(admin)
    .setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
    .then(async tx => await tx.wait())
  await badge
    .connect(admin)
    .setB3trGovernorAddress(await governor.getAddress())
    .then(async tx => await tx.wait())

  //Set the emissions address as the ROUND_STARTER_ROLE in XAllocationVoting
  const roundStarterRole = await xAllocationVoting.ROUND_STARTER_ROLE()
  await xAllocationVoting
    .connect(admin)
    .grantRole(roundStarterRole, await emissions.getAddress())
    .then(async tx => await tx.wait())

  // ---------- Seeding ---------- //
  if (network.name === "vechain_testnet") {
    await seedTestEnvironment(b3tr, xAllocationVoting, emissions)
  } else if (network.name === "vechain_solo") {
    await seedLocalEnvironment(b3tr, vot3, xAllocationVoting, emissions)
  }

  // ---------- Role updates ---------- //
  // Do not update roles on solo network since it would just increase dev time
  if (network.name === "vechain_testnet") {
    console.log("Updating roles...")
    console.log("New admin address", config.CONTRACTS_ADMIN_ADDRESS)

    await transferMinterRole(b3tr, admin, TEMP_ADMIN, await emissions.getAddress())
    await transferAdminRole(b3tr, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferAdminRole(badge, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferMinterRole(emissions, admin, admin.address, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(emissions, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferAdminRole(vot3, admin, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(voterRewards, admin, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(xAllocationPool, admin, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(xAllocationVoting, admin, config.CONTRACTS_ADMIN_ADDRESS)

    console.log("Roles updated successfully!")
  }

  console.log("contracts", {
    b3trContractAddress: await b3tr.getAddress(),
    vot3ContractAddress: await vot3.getAddress(),
    b3trGovernorAddress: await governor.getAddress(),
    timelockContractAddress: await timelock.getAddress(),
    xAllocationPoolContractAddress: await xAllocationPool.getAddress(),
    xAllocationVotingContractAddress: await xAllocationVoting.getAddress(),
    emissionsContractAddress: await emissions.getAddress(),
    voterRewardsContractAddress: await voterRewards.getAddress(),
    nftBadgeContractAddress: await badge.getAddress(),
  })

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

const transferAdminRole = async (
  contract: B3TR | VOT3 | B3TRBadge | Emissions | VoterRewards | XAllocationPool | XAllocationVoting,
  oldAdmin: HardhatEthersSigner,
  newAdminAddress: string,
) => {
  const adminRole = await contract.DEFAULT_ADMIN_ROLE()
  await contract
    .connect(oldAdmin)
    .grantRole(adminRole, newAdminAddress)
    .then(async tx => await tx.wait())
  await contract
    .connect(oldAdmin)
    .renounceRole(adminRole, oldAdmin.address)
    .then(async tx => await tx.wait())

  const newAdminSet = await contract.hasRole(adminRole, newAdminAddress)
  const oldAdminRemoved = !(await contract.hasRole(adminRole, oldAdmin.address))
  if (!newAdminSet || !oldAdminRemoved)
    throw new Error("Admin role not set correctly on " + (await contract.getAddress()))
}

const transferMinterRole = async (
  contract: Emissions | B3TR,
  admin: HardhatEthersSigner,
  oldMinterAddress: string,
  newMinterAddress?: string,
) => {
  const minterRole = await contract.MINTER_ROLE()

  // If newMinterAddress is provided, set a new minter before revoking the old one
  // otherwise just revoke the old one
  if (newMinterAddress) {
    await contract
      .connect(admin)
      .grantRole(minterRole, newMinterAddress)
      .then(async tx => await tx.wait())
    await contract
      .connect(admin)
      .revokeRole(minterRole, oldMinterAddress)
      .then(async tx => await tx.wait())

    const newMinterSet = await contract.hasRole(minterRole, newMinterAddress)
    const oldMinterRemoved = !(await contract.hasRole(minterRole, oldMinterAddress))
    if (!newMinterSet || !oldMinterRemoved)
      throw new Error("Minter role not set correctly on " + (await contract.getAddress()))
  } else {
    await contract
      .connect(admin)
      .revokeRole(minterRole, oldMinterAddress)
      .then(async tx => await tx.wait())

    const oldMinterRemoved = !(await contract.hasRole(minterRole, oldMinterAddress))
    if (!oldMinterRemoved) throw new Error("Minter role not removed correctly on " + (await contract.getAddress()))
  }
}

async function deployB3trToken(admin: string, cap: number): Promise<B3TR> {
  console.log(`Deploying B3tr contract`)
  const B3trContract = await ethers.getContractFactory("B3TR") // Use the global variable
  const contract = await B3trContract.deploy(admin, admin, cap)

  await contract.waitForDeployment()

  console.log(`B3tr contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployVot3Token(admin: string, b3trAddress: string): Promise<VOT3> {
  console.log(`Deploying Vot3 contract`)
  const Vot3Contract = await ethers.getContractFactory("VOT3") // Use the global variable
  const contract = await Vot3Contract.deploy(admin, b3trAddress)

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

  const contract = (await deployProxy("B3TRGovernor", [
    vot3Address,
    timelockAddress,
    quorum,
    votingPeriod,
    votingDelay,
    proposalThreshold,
  ])) as B3TRGovernor

  console.log(`Governor contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployNFTBadge(
  mintableLevelFromDeploy: number,
  name: string,
  symbol: string,
  admin: string,
  baseUri: string,
) {
  console.log(`Deploying B3TRBadge NFT contract`)
  const NFTBadgeContract = await ethers.getContractFactory("B3TRBadge")
  const contract = await NFTBadgeContract.deploy(name, symbol, admin, mintableLevelFromDeploy, baseUri)

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
  baseURI: string = "ipfs://",
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
    baseURI,
  )

  await contract.waitForDeployment()

  console.log(`XAllocationVoting contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployEmissions(
  b3trAddress: string,
  destinations: string[],
  allocations: bigint,
  minterAddress: string,
  adminAddress: string,
  cycleDuration: number,
  decaySettings: [number, number, number, number],
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
    allocations,
    cycleDuration,
    decaySettings as [number, number, number, number],
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
