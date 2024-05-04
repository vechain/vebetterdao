import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory, ContractTransactionResponse } from "ethers"
import { ethers } from "hardhat"
import {
  B3TR,
  TimeLock,
  VOT3,
  GalaxyMember,
  Emissions,
  XAllocationVoting,
  XAllocationPool,
  VoterRewards,
  Treasury,
  B3TRGovernor,
  X2EarnApps,
} from "../../typechain-types"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { deployProxy } from "../../scripts/helpers"
import { setWhitelistedFunctions } from "../../scripts/deploy/deploy"

interface DeployInstance {
  B3trContract: ContractFactory
  b3tr: B3TR & { deploymentTransaction(): ContractTransactionResponse }
  vot3: VOT3
  timeLock: TimeLock
  governor: B3TRGovernor
  galaxyMember: GalaxyMember
  x2EarnApps: X2EarnApps
  xAllocationVoting: XAllocationVoting
  xAllocationPool: XAllocationPool
  emissions: Emissions
  voterRewards: VoterRewards
  treasury: Treasury
  owner: HardhatEthersSigner
  otherAccount: HardhatEthersSigner
  minterAccount: HardhatEthersSigner
  timelockAdmin: HardhatEthersSigner
  otherAccounts: HardhatEthersSigner[]
}

export const NFT_NAME = "GalaxyMember"
export const NFT_SYMBOL = "GM"
export const DEFAULT_MAX_MINTABLE_LEVEL = 1

// // Voter Rewards
export const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Galaxy Member contract levels
export const multipliers = [0, 10, 20, 50, 100, 150, 200, 400, 900, 2400] // Galaxy Member contract percentage multipliers (in basis points)

let cachedDeployInstance: DeployInstance | undefined = undefined
export const getOrDeployContractInstances = async ({
  forceDeploy = false,
  config = createLocalConfig(),
  maxMintableLevel = DEFAULT_MAX_MINTABLE_LEVEL,
}) => {
  if (!forceDeploy && cachedDeployInstance !== undefined) {
    return cachedDeployInstance
  }

  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount, minterAccount, timelockAdmin, ...otherAccounts] = await ethers.getSigners()

  // Deploy Libraries
  const DataTypes = await ethers.getContractFactory("DataTypes")
  const DataTypesLib = await DataTypes.deploy()
  await DataTypesLib.waitForDeployment()

  // Deploy B3TR
  const B3trContract = await ethers.getContractFactory("B3TR")
  const b3tr = await B3trContract.deploy(owner, minterAccount, config.B3TR_CAP)

  // Deploy VOT3
  const vot3 = (await deployProxy("VOT3", [owner.address, await b3tr.getAddress()])) as VOT3

  // Deploy TimeLock
  const timeLock = (await deployProxy("TimeLock", [
    0, //0 seconds delay for immediate execution
    [],
    [],
    timelockAdmin.address,
    timelockAdmin.address,
  ])) as TimeLock

  // Deploy Treasury
  const treasury = (await deployProxy("Treasury", [
    await b3tr.getAddress(),
    await vot3.getAddress(),
    owner.address,
    owner.address,
    owner.address,
  ])) as Treasury

  // Deploy GalaxyMember
  const galaxyMember = (await deployProxy("GalaxyMember", [
    NFT_NAME,
    NFT_SYMBOL,
    owner.address,
    owner.address,
    maxMintableLevel,
    config.GM_NFT_BASE_URI,
    config.GM_NFT_X_NODE_UPGRADEABLE_LEVELS,
    config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
    await b3tr.getAddress(),
    await treasury.getAddress(),
  ])) as GalaxyMember

  // Deploy X2EarnApps
  const x2EarnApps = (await deployProxy(
    "X2EarnApps",
    ["ipfs://", [await timeLock.getAddress(), owner.address], owner.address],
    {
      DataTypes: await DataTypesLib.getAddress(),
    },
  )) as X2EarnApps

  // Deploy XAllocationPool
  const xAllocationPool = (await deployProxy("XAllocationPool", [
    owner.address,
    owner.address,
    await b3tr.getAddress(),
    await treasury.getAddress(),
    await x2EarnApps.getAddress(),
  ])) as XAllocationPool

  const X_ALLOCATIONS_ADDRESS = await xAllocationPool.getAddress()
  const VOTE_2_EARN_ADDRESS = otherAccounts[1].address

  const emissions = (await deployProxy("Emissions", [
    {
      minter: minterAccount.address,
      admin: owner.address,
      upgrader: owner.address,
      b3trAddress: await b3tr.getAddress(),
      destinations: [X_ALLOCATIONS_ADDRESS, VOTE_2_EARN_ADDRESS, await treasury.getAddress()],
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

  const voterRewards = (await deployProxy("VoterRewards", [
    owner.address,
    owner.address,
    await emissions.getAddress(),
    await galaxyMember.getAddress(),
    await b3tr.getAddress(),
    levels,
    multipliers,
  ])) as VoterRewards

  // Set vote 2 earn (VoterRewards deployed contract) address in emissions
  await emissions.connect(owner).setVote2EarnAddress(await voterRewards.getAddress())

  // Deploy XAllocationVoting
  const xAllocationVoting = (await deployProxy("XAllocationVoting", [
    {
      vot3Token: await vot3.getAddress(),
      quorumPercentage: config.X_ALLOCATION_VOTING_QUORUM_PERCENTAGE, // quorum percentage
      initialVotingPeriod: config.EMISSIONS_CYCLE_DURATION - 1, // X Alloc voting period
      timeLock: await timeLock.getAddress(),
      voterRewards: await voterRewards.getAddress(),
      emissions: await emissions.getAddress(),
      admins: [await timeLock.getAddress(), owner.address],
      upgrader: owner.address,
      x2EarnAppsAddress: await x2EarnApps.getAddress(),
      baseAllocationPercentage: config.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE,
      appSharesCap: config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP,
      votingThreshold: config.X_ALLOCATION_VOTING_VOTING_THRESHOLD,
    },
  ])) as XAllocationVoting

  // Deploy Governor
  const governor = (await deployProxy("B3TRGovernor", [
    {
      vot3Token: await vot3.getAddress(),
      timelock: await timeLock.getAddress(),
      xAllocationVoting: await xAllocationVoting.getAddress(),
      quorumPercentage: config.B3TR_GOVERNOR_QUORUM_PERCENTAGE, // quorum percentage
      initialDepositThreshold: config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD, // voting threshold
      initialMinVotingDelay: config.B3TR_GOVERNOR_MIN_VOTING_DELAY, // delay before vote starts
      initialVotingThreshold: config.B3TR_GOVERNOR_VOTING_THRESHOLD, // voting threshold
      governorAdmin: owner.address,
      voterRewards: await voterRewards.getAddress(),
      governorFunctionSettingsRoleAddress: owner.address,
      isFunctionRestrictionEnabled: true,
    },
  ])) as B3TRGovernor

  const contractAddresses: Record<string, string> = {
    B3TR: await b3tr.getAddress(),
    VoterRewards: await voterRewards.getAddress(),
    Treasury: await treasury.getAddress(),
    XAllocationVoting: await xAllocationVoting.getAddress(),
    Emissions: await emissions.getAddress(),
    GalaxyMember: await galaxyMember.getAddress(),
    TimeLock: await timeLock.getAddress(),
    VOT3: await vot3.getAddress(),
    XAllocationPool: await xAllocationPool.getAddress(),
    B3TRGovernor: await governor.getAddress(),
    X2EarnApps: await x2EarnApps.getAddress(),
  }

  await setWhitelistedFunctions(contractAddresses, config, governor, owner) // Set whitelisted functions for governor proposals

  // Set up roles
  const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE()
  const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE()
  const CANCELLER_ROLE = await timeLock.CANCELLER_ROLE()
  await timeLock.connect(timelockAdmin).grantRole(PROPOSER_ROLE, await governor.getAddress())
  await timeLock.connect(timelockAdmin).grantRole(EXECUTOR_ROLE, await governor.getAddress())
  await timeLock.connect(timelockAdmin).grantRole(CANCELLER_ROLE, await governor.getAddress())

  // Set xAllocationVoting and Governor address in GalaxyMember
  await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
  await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())

  // Grant Vote registrar role to XAllocationVoting
  await voterRewards.connect(owner).setVoteRegistrarRole(await xAllocationVoting.getAddress())
  // Grant Vote registrar role to Governor
  await voterRewards.connect(owner).setVoteRegistrarRole(await governor.getAddress())

  // Grant admin role to voter rewards for registering x allocation voting
  await xAllocationVoting.connect(owner).grantRole(await xAllocationVoting.DEFAULT_ADMIN_ROLE(), emissions.getAddress())

  // Set xAllocationGovernor in emissions
  await emissions.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

  // Setup XAllocationPool addresses
  await xAllocationPool.connect(owner).setXAllocationVotingAddress(await xAllocationVoting.getAddress())
  await xAllocationPool.connect(owner).setEmissionsAddress(await emissions.getAddress())

  //Set the emissions address and the admin as the ROUND_STARTER_ROLE in XAllocationVoting
  const roundStarterRole = await xAllocationVoting.ROUND_STARTER_ROLE()
  await xAllocationVoting
    .connect(owner)
    .grantRole(roundStarterRole, await emissions.getAddress())
    .then(async tx => await tx.wait())
  await xAllocationVoting
    .connect(owner)
    .grantRole(roundStarterRole, owner.address)
    .then(async tx => await tx.wait())

  cachedDeployInstance = {
    B3trContract,
    b3tr,
    vot3,
    timeLock,
    governor,
    galaxyMember,
    x2EarnApps,
    xAllocationVoting,
    xAllocationPool,
    emissions,
    voterRewards,
    owner,
    otherAccount,
    minterAccount,
    timelockAdmin,
    otherAccounts,
    treasury,
  }
  return cachedDeployInstance
}
