import { ethers, network } from "hardhat"
import {
  B3TR,
  Emissions,
  VOT3,
  XAllocationVoting,
  TimeLock,
  B3TRGovernor,
  GalaxyMember,
  VoterRewards,
  XAllocationPool,
  Treasury,
  X2EarnApps,
} from "../../typechain-types"
import { ContractsConfig } from "@repo/config/contracts/type"
import { HttpNetworkConfig } from "hardhat/types"
import { setupLocalEnvironment, setupTestEnvironment } from "./setup"
import { simulateRounds } from "./simulateRounds"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { deployProxy } from "../helpers"
import { shouldRunSimulation } from "@repo/config/contracts"

// GalaxyMember NFT Values
const name = "VeBetterDAO Galaxy Member"
const symbol = "GM"

export async function deployAll(config: ContractsConfig) {
  const start = performance.now()
  const networkConfig = network.config as HttpNetworkConfig
  console.log(
    `================  Deploying contracts on ${network.name} (${networkConfig.url}) with ${config.NEXT_PUBLIC_APP_ENV} configurations ================`,
  )
  const [admin] = await ethers.getSigners()

  // We use a temporary admin to deploy and initialize contracts then transfer role to the real admin
  const TEMP_ADMIN = network.name === "vechain_solo" ? config.CONTRACTS_ADMIN_ADDRESS : admin.address
  console.log("Temporary admin set to ", TEMP_ADMIN)

  // ---------- Contracts Deployment ---------- //

  // Deploy Libraries
  const DataTypes = await ethers.getContractFactory("DataTypes")
  const DataTypesLib = await DataTypes.deploy()
  await DataTypesLib.waitForDeployment()
  console.log(`DataTypes deployed at ${await DataTypesLib.getAddress()}`)

  const b3tr = await deployB3trToken(TEMP_ADMIN, config.B3TR_CAP)

  const vot3 = (await deployProxy("VOT3", [TEMP_ADMIN, await b3tr.getAddress()])) as VOT3
  console.log(`Vot3 deployed at ${await vot3.getAddress()}`)

  const timelock = (await deployProxy("TimeLock", [
    config.B3TR_GOVERNOR_MIN_DELAY,
    [],
    [],
    TEMP_ADMIN,
    TEMP_ADMIN,
  ])) as TimeLock
  console.log(`TimeLock deployed at ${await timelock.getAddress()}`)

  const treasury = (await deployProxy("Treasury", [
    await b3tr.getAddress(),
    await vot3.getAddress(),
    await timelock.getAddress(),
    TEMP_ADMIN,
    TEMP_ADMIN,
  ])) as Treasury
  console.log(`Treasury deployed at ${await treasury.getAddress()}`)

  const x2EarnApps = (await deployProxy(
    "X2EarnApps",
    [config.XAPP_BASE_URI, [await timelock.getAddress(), TEMP_ADMIN], TEMP_ADMIN],
    {
      DataTypes: await DataTypesLib.getAddress(),
    },
  )) as X2EarnApps
  console.log(`X2EarnApps deployed at ${await x2EarnApps.getAddress()}`)

  const xAllocationPool = (await deployProxy("XAllocationPool", [
    TEMP_ADMIN,
    TEMP_ADMIN,
    await b3tr.getAddress(),
    await treasury.getAddress(),
    await x2EarnApps.getAddress(),
  ])) as XAllocationPool
  console.log(`XAllocationPool deployed at ${await xAllocationPool.getAddress()}`)

  // Deploy the GalaxyMember contract with Max Mintable Level 1
  const galaxyMember = (await deployProxy("GalaxyMember", [
    name,
    symbol,
    TEMP_ADMIN,
    TEMP_ADMIN,
    1,
    config.GM_NFT_BASE_URI,
    config.GM_NFT_X_NODE_UPGRADEABLE_LEVELS,
    config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
    await b3tr.getAddress(),
    await treasury.getAddress(),
  ])) as GalaxyMember
  console.log(`GalaxyMember deployed at ${await galaxyMember.getAddress()}`)

  const emissions = (await deployProxy("Emissions", [
    {
      minter: TEMP_ADMIN,
      admin: TEMP_ADMIN,
      upgrader: TEMP_ADMIN,
      b3trAddress: await b3tr.getAddress(),
      destinations: [await xAllocationPool.getAddress(), config.VOTE_2_EARN_POOL_ADDRESS, await treasury.getAddress()],
      initialXAppAllocation: config.INITIAL_X_ALLOCATION,
      cycleDuration: config.EMISSIONS_CYCLE_DURATION,
      decaySettings: [
        config.EMISSIONS_X_ALLOCATION_DECAY_PERCENTAGE,
        config.EMISSIONS_VOTE_2_EARN_DECAY_PERCENTAGE,
        config.EMISSIONS_X_ALLOCATION_DECAY_PERIOD,
        config.EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD,
      ],
      treasuryPercentage: config.EMISSIONS_TREASURY_PERCENTAGE,
      maxVote2EarnDecay: config.EMISSIONS_MAX_VOTE_2_EARN_DECAY_PERCENTAGE,
    },
  ])) as Emissions
  console.log(`Emissions deployed at ${await emissions.getAddress()}`)

  const voterRewards = (await deployProxy("VoterRewards", [
    TEMP_ADMIN,
    TEMP_ADMIN,
    await emissions.getAddress(),
    await galaxyMember.getAddress(),
    await b3tr.getAddress(),
    config.VOTER_REWARDS_LEVELS,
    config.VOTER_REWARDS_MULTIPLIER,
  ])) as VoterRewards
  console.log(`VoterRewards deployed at ${await voterRewards.getAddress()}`)

  const xAllocationVoting = (await deployProxy("XAllocationVoting", [
    {
      vot3Token: await vot3.getAddress(),
      quorumPercentage: config.X_ALLOCATION_VOTING_QUORUM_PERCENTAGE,
      initialVotingPeriod: config.EMISSIONS_CYCLE_DURATION - 1,
      timeLock: await timelock.getAddress(),
      voterRewards: await voterRewards.getAddress(),
      emissions: await emissions.getAddress(),
      admins: [await timelock.getAddress(), TEMP_ADMIN],
      upgrader: TEMP_ADMIN,
      x2EarnAppsAddress: await x2EarnApps.getAddress(),
      baseAllocationPercentage: config.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE,
      appSharesCap: config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP,
    },
  ])) as XAllocationVoting
  console.log(`XAllocationVoting deployed at ${await xAllocationVoting.getAddress()}`)

  const governor = (await deployProxy("B3TRGovernor", [
    await vot3.getAddress(),
    await timelock.getAddress(),
    await xAllocationVoting.getAddress(),
    config.B3TR_GOVERNOR_QUORUM_PERCENTAGE,
    config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD,
    config.B3TR_GOVERNOR_MIN_VOTING_DELAY,
    TEMP_ADMIN,
    await voterRewards.getAddress(),
  ])) as B3TRGovernor
  console.log(`Governor deployed at ${await governor.getAddress()}`)

  const date = new Date(performance.now() - start)
  console.log(`Contracts deployed in ${date.getMinutes()}m ${date.getSeconds()}s`)

  // ---------- Configure contract roles for setup ---------- //

  console.log("================ Configuring contract roles for setup =================")

  // TODO: Uncomment this line to pause public minting of GM NFTs when deploying to Mainnet
  // await galaxyMember.connect(admin).setIsPublicMintingPaused(true)
  // console.log("Public minting of GM NFTs paused")

  // Grant MINTER_ROLE on B3TR to emissions contract so it can bootstrap and distribute
  await b3tr.grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress()).then(async tx => await tx.wait())
  console.log("Minter role granted to emissions contract")

  // Set proposer, canceller and executor role to timelock
  const PROPOSER_ROLE = await timelock.PROPOSER_ROLE()
  const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE()
  const CANCELLER_ROLE = await timelock.CANCELLER_ROLE()
  await timelock.grantRole(PROPOSER_ROLE, await governor.getAddress())
  await timelock.grantRole(EXECUTOR_ROLE, await governor.getAddress())
  await timelock.grantRole(CANCELLER_ROLE, await governor.getAddress())
  console.log("Proposer, executor and canceller role granted to governor")

  // Grant treasury GOVERNANCE_ROLE to treasury contract admin for intial phases of project
  const GOVERNANCE_ROLE = await treasury.GOVERNANCE_ROLE()
  await treasury.grantRole(GOVERNANCE_ROLE, TEMP_ADMIN)
  console.log("Governance role granted to treasury contract admin")

  // Grant Vote Registrar role to XAllocationVoting
  await voterRewards
    .connect(admin)
    .setVoteRegistrarRole(await xAllocationVoting.getAddress())
    .then(async tx => await tx.wait())
  console.log("Vote registrar role granted to XAllocationVoting")

  // Emissions contract should be able to start new rounds
  await xAllocationVoting
    .connect(admin)
    .grantRole(await xAllocationVoting.DEFAULT_ADMIN_ROLE(), await emissions.getAddress())
    .then(async tx => await tx.wait())
  console.log("Admin role granted to emissions contract")

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
  console.log("XAllocationsGovernor and Vote2Earn address set in Emissions contract")

  // Setup XAllocationPool addresses
  await xAllocationPool
    .connect(admin)
    .setXAllocationVotingAddress(await xAllocationVoting.getAddress())
    .then(async tx => await tx.wait())
  await xAllocationPool
    .connect(admin)
    .setEmissionsAddress(await emissions.getAddress())
    .then(async tx => await tx.wait())
  console.log("XAllocationVoting and Emissions address set in XAllocationPool contract")

  // Set xAllocationVoting and B3TRGovernor address in GalaxyMember
  await galaxyMember
    .connect(admin)
    .setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
    .then(async tx => await tx.wait())
  await galaxyMember
    .connect(admin)
    .setB3trGovernorAddress(await governor.getAddress())
    .then(async tx => await tx.wait())
  console.log("XAllocationsGovernor and B3trGovernor address set in GalaxyMember contract")

  //Set the emissions address as the ROUND_STARTER_ROLE in XAllocationVoting
  const roundStarterRole = await xAllocationVoting.ROUND_STARTER_ROLE()
  await xAllocationVoting
    .connect(admin)
    .grantRole(roundStarterRole, await emissions.getAddress())
    .then(async tx => await tx.wait())
  console.log("Round starter role granted to emissions contract")

  // ---------- Setup Contracts ---------- //
  if (network.name === "vechain_testnet") {
    await setupTestEnvironment(emissions, x2EarnApps)
  } else if (network.name === "vechain_solo") {
    await setupLocalEnvironment(emissions, treasury, x2EarnApps)
  }

  // ---------- Run Simulation ---------- //
  if (shouldRunSimulation()) {
    await simulateRounds(b3tr, vot3, xAllocationVoting, emissions, voterRewards, treasury)
  }

  // ---------- Role updates ---------- //
  // Do not update roles on solo network since it would just increase dev time
  if (network.name === "vechain_testnet") {
    console.log("================ Updating contract roles after setup ================ ")
    console.log("New admin address", config.CONTRACTS_ADMIN_ADDRESS)

    await transferMinterRole(b3tr, admin, TEMP_ADMIN, await emissions.getAddress())
    await transferAdminRole(b3tr, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferAdminRole(galaxyMember, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferMinterRole(emissions, admin, admin.address, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(emissions, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferAdminRole(vot3, admin, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(voterRewards, admin, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(xAllocationPool, admin, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(xAllocationVoting, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferGovernanceRole(treasury, admin, admin.address, config.CONTRACTS_ADMIN_ADDRESS)
    await transferAdminRole(treasury, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferAdminRole(governor, admin, config.CONTRACTS_ADMIN_ADDRESS)

    await transferAdminRole(x2EarnApps, admin, config.CONTRACTS_ADMIN_ADDRESS)

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
    galaxyMemberContractAddress: await galaxyMember.getAddress(),
    treasuryContractAddress: await treasury.getAddress(),
    x2EarnAppsContractAddress: await x2EarnApps.getAddress(),
  })

  const end = new Date(performance.now() - start)
  console.log(`Total execution time: ${end.getMinutes()}m ${end.getSeconds()}s`)

  return {
    governor: governor,
    timelock: timelock,
    b3tr: b3tr,
    vot3: vot3,
    galaxyMember: galaxyMember,
    xAllocationPool: xAllocationPool,
    xAllocationVoting: xAllocationVoting,
    emissions: emissions,
    voterRewards: voterRewards,
    treasury: treasury,
    x2EarnApps: x2EarnApps,
  }
  // close the script
}

const transferAdminRole = async (
  contract:
    | B3TR
    | VOT3
    | GalaxyMember
    | Emissions
    | VoterRewards
    | XAllocationPool
    | XAllocationVoting
    | Treasury
    | B3TRGovernor
    | X2EarnApps,
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

  console.log("Admin role transferred successfully on " + typeof contract)
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

    console.log("Minter role transferred successfully on " + typeof contract)
  } else {
    await contract
      .connect(admin)
      .revokeRole(minterRole, oldMinterAddress)
      .then(async tx => await tx.wait())

    const oldMinterRemoved = !(await contract.hasRole(minterRole, oldMinterAddress))
    if (!oldMinterRemoved) throw new Error("Minter role not removed correctly on " + (await contract.getAddress()))

    console.log("Minter role revoked (without granting new) successfully on " + typeof contract)
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

    console.log("Governance role transferred successfully on " + typeof contract)
  } else {
    await contract
      .connect(admin)
      .revokeRole(governanceRole, oldAddress)
      .then(async tx => await tx.wait())

    const oldGovernanceRemoved = !(await contract.hasRole(governanceRole, oldAddress))
    if (!oldGovernanceRemoved)
      throw new Error("Governance role not removed correctly on " + (await contract.getAddress()))

    console.log("Governance role revoked (without granting new) successfully on " + typeof contract)
  }
}

async function deployB3trToken(admin: string, cap: number): Promise<B3TR> {
  const B3trContract = await ethers.getContractFactory("B3TR") // Use the global variable
  const contract = await B3trContract.deploy(admin, admin, cap)

  await contract.waitForDeployment()

  console.log(`B3tr deployed at ${await contract.getAddress()}`)

  return contract
}
