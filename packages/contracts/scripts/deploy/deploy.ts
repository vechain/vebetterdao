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
  Treasury,
} from "../../typechain-types"
import { ContractsConfig } from "@repo/config/contracts/type"
import { HttpNetworkConfig } from "hardhat/types"
import { seedLocalEnvironment, seedTestEnvironment } from "./seed"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { deployProxy } from "../helpers"

// NFT Badge Values
const name = "VeBetterDAO Galaxy Member"
const symbol = "GM"

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
  const timelock = await deployTimeLock(config.B3TR_GOVERNOR_MIN_DELAY, TEMP_ADMIN, TEMP_ADMIN)
  const governor = await deployGovernor(
    await vot3.getAddress(),
    await timelock.getAddress(),
    config.B3TR_GOVERNOR_QUORUM_PERCENTAGE,
    config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD,
    TEMP_ADMIN,
  )

  const treasury = await deployTreasury(
    await b3tr.getAddress(),
    await vot3.getAddress(),
    await timelock.getAddress(),
    TEMP_ADMIN,
    TEMP_ADMIN,
  )

  // Deploy XAllocationPool
  const xAllocationPool = await deployXAllocationPool(
    await b3tr.getAddress(),
    TEMP_ADMIN,
    TEMP_ADMIN,
    await treasury.getAddress(),
  )

  // Deploy the NFT Badge contract with Max Mintable Level 1
  const badge = await deployNFTBadge(
    1,
    name,
    symbol,
    TEMP_ADMIN,
    TEMP_ADMIN,
    config.NFT_BADGE_BASE_URI,
    config.NFT_BADGE_X_NODE_UPGRADEABLE_LEVELS,
    config.NFT_BADGE_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
    await b3tr.getAddress(),
    await treasury.getAddress(),
  )

  const emissions = await deployEmissions(
    await b3tr.getAddress(),
    [await xAllocationPool.getAddress(), config.VOTE_2_EARN_POOL_ADDRESS, await treasury.getAddress()],
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
    TEMP_ADMIN,
    config.VOTER_REWARDS_LEVELS,
    config.VOTER_REWARDS_MULTIPLIER,
  )

  // Deploy XAllocationVoting
  const xAllocationVoting = await deployXAllocationVoting(
    await timelock.getAddress(),
    await vot3.getAddress(),
    TEMP_ADMIN,
    TEMP_ADMIN,
    await voterRewards.getAddress(),
    await emissions.getAddress(),
    config.X_ALLOCATION_VOTING_QUORUM_PERCENTAGE,
    config.EMISSIONS_CYCLE_DURATION - 1,
    config.XAPP_BASE_URI,
    config.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE,
    config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP,
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

  // Grant treasury GOVERNANCE_ROLE to treasury contract admin for intial phases of project
  const GOVERNANCE_ROLE = await treasury.GOVERNANCE_ROLE()
  await treasury.grantRole(GOVERNANCE_ROLE, TEMP_ADMIN)

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
    await seedLocalEnvironment(treasury, vot3, xAllocationVoting, emissions)
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

    await transferGovernanceRole(treasury, admin, admin.address, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(treasury, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferAdminRole(governor, admin, config.CONTRACTS_ADMIN_ADDRESS)

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
    treasuryContractAddress: await treasury.getAddress(),
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
    treasury: treasury,
  }
  // close the script
}

const transferAdminRole = async (
  contract:
    | B3TR
    | VOT3
    | B3TRBadge
    | Emissions
    | VoterRewards
    | XAllocationPool
    | XAllocationVoting
    | Treasury
    | B3TRGovernor,
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

// Transfer governance role to treasury contract admin for intial phases of project
const transferGovernanceRole = async (
  contract: Treasury,
  admin: HardhatEthersSigner,
  oldAddress: string,
  newAddress?: string,
) => {
  const governanceRole = await contract.GOVERNANCE_ROLE()

  // If newMinterAddress is provided, set a new minter before revoking the old one
  // otherwise just revoke the old one
  if (newAddress) {
    await contract
      .connect(admin)
      .grantRole(governanceRole, newAddress)
      .then(async tx => await tx.wait())
    await contract
      .connect(admin)
      .revokeRole(governanceRole, oldAddress)
      .then(async tx => await tx.wait())

    const newGovernanceSet = await contract.hasRole(governanceRole, newAddress)
    const oldGovernanceRemoved = !(await contract.hasRole(governanceRole, oldAddress))
    if (!newGovernanceSet || !oldGovernanceRemoved)
      throw new Error("Minter role not set correctly on " + (await contract.getAddress()))
  } else {
    await contract
      .connect(admin)
      .revokeRole(governanceRole, oldAddress)
      .then(async tx => await tx.wait())

    const oldGovernanceRemoved = !(await contract.hasRole(governanceRole, oldAddress))
    if (!oldGovernanceRemoved)
      throw new Error("Governance role not removed correctly on " + (await contract.getAddress()))
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
  const contract = (await deployProxy("VOT3", [admin, b3trAddress])) as VOT3

  console.log(`Vot3 contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployTimeLock(
  minDelay: number,
  admin: string,
  upgrader: string,
  proposers: string[] = [],
  executors: string[] = [],
): Promise<TimeLock> {
  console.log(`Deploying TimeLock contract`)
  const contract = (await deployProxy("TimeLock", [minDelay, proposers, executors, admin, upgrader])) as TimeLock
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
  admin: string,
): Promise<B3TRGovernor> {
  console.log(`Deploying Governor contract`)

  const contract = (await deployProxy("B3TRGovernor", [
    vot3Address,
    timelockAddress,
    quorum,
    votingPeriod,
    votingDelay,
    proposalThreshold,
    admin,
  ])) as B3TRGovernor

  console.log(`Governor contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployNFTBadge(
  mintableLevelFromDeploy: number,
  name: string,
  symbol: string,
  admin: string,
  upgrader: string,
  baseUri: string,
  xNodeMaxFreeLevels: number[],
  b3trRequiredToUpgradeToLevel: bigint[],
  b3trAddress: string,
  treasuryAddress: string,
) {
  console.log(`Deploying B3TRBadge NFT contract`)
  const contract = (await deployProxy("B3TRBadge", [
    name,
    symbol,
    admin,
    upgrader,
    mintableLevelFromDeploy,
    baseUri,
    xNodeMaxFreeLevels,
    b3trRequiredToUpgradeToLevel,
    b3trAddress,
    treasuryAddress,
  ])) as B3TRBadge

  console.log(`NFTBadge contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployXAllocationPool(
  b3trAddress: string,
  adminAddress: string,
  upgraderAddress: string,
  treasuryAddress: string,
) {
  console.log(`Deploying XAllocationPool contract`)
  const contract = (await deployProxy("XAllocationPool", [
    adminAddress,
    upgraderAddress,
    b3trAddress,
    treasuryAddress,
  ])) as XAllocationPool

  console.log(`XAllocationPool contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployXAllocationVoting(
  timeLockAddress: string,
  vot3Address: string,
  adminAddress: string,
  upgraderAddress: string,
  voterRewardsAddress: string,
  emissionsAddress: string,
  quorumPercentage: number = 50,
  xAllocationVotingPeriod: number = 10,
  baseURI: string = "ipfs://",
  baseAllocationPercentage: number = 20,
  appSharesCap: number = 15,
) {
  console.log(`Deploying XAllocationVoting contract`)

  const contract = (await deployProxy("XAllocationVoting", [
    {
      vot3Token: vot3Address,
      quorumPercentage,
      initialVotingPeriod: xAllocationVotingPeriod,
      b3trGovernor: timeLockAddress,
      voterRewards: voterRewardsAddress,
      emissions: emissionsAddress,
      admins: [timeLockAddress, adminAddress],
      upgrader: upgraderAddress,
      xAppsBaseURI: baseURI,
      baseAllocationPercentage,
      appSharesCap,
    },
  ])) as XAllocationVoting

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
  const contract = (await deployProxy("Emissions", [
    {
      minter: minterAddress,
      admin: adminAddress,
      upgrader: adminAddress,
      b3trAddress: b3trAddress,
      destinations: destinations,
      initialXAppAllocation: allocations,
      cycleDuration: cycleDuration,
      decaySettings: decaySettings,
      treasuryPercentage: treasuryPercentage,
      maxVote2EarnDecay: maxVote2EarnDecayPercentage,
    },
  ])) as Emissions

  console.log(`Emissions contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployVoterRewards(
  badgeAddress: string,
  emissionsAddress: string,
  b3trAddress: string,
  adminAddress: string,
  upgraderAddress: string,
  levels: number[],
  multiplier: number[],
) {
  console.log(`Deploying VoterRewards contract`)
  const contract = (await deployProxy("VoterRewards", [
    adminAddress,
    upgraderAddress,
    emissionsAddress,
    badgeAddress,
    b3trAddress,
    levels,
    multiplier,
  ])) as VoterRewards

  console.log(`VoterRewards contract deployed at address ${await contract.getAddress()}`)

  return contract
}

async function deployTreasury(
  b3trAddress: string,
  vot3Address: string,
  timelockAddress: string,
  adminAddress: string,
  proxyAdminAddress: string,
) {
  console.log(`Deploying Treasury contract`)

  const contract = (await deployProxy("Treasury", [
    b3trAddress,
    vot3Address,
    timelockAddress,
    adminAddress,
    proxyAdminAddress,
  ])) as Treasury

  console.log(`Treasury contract deployed at address ${await contract.getAddress()}`)

  return contract
}
