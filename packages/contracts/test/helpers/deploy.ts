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
  X2EarnApps,
  GovernorClockLogicV1,
  GovernorConfiguratorV1,
  GovernorDepositLogicV1,
  GovernorFunctionRestrictionsLogicV1,
  GovernorGovernanceLogicV1,
  GovernorProposalLogicV1,
  GovernorQuorumLogicV1,
  GovernorStateLogicV1,
  GovernorVotesLogicV1,
  X2EarnRewardsPool,
  MyERC721,
  MyERC1155,
  TokenAuction,
  X2EarnAppsV1,
  XAllocationPoolV1,
  X2EarnRewardsPoolV1,
  XAllocationVotingV1,
  NodeManagement,
  GalaxyMemberV1,
  VoterRewardsV1,
  B3TRGovernorV1,
} from "../../typechain-types"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { deployProxy, upgradeProxy } from "../../scripts/helpers"
import { setWhitelistedFunctions } from "../../scripts/deploy/deploy"
import { bootstrapAndStartEmissions as callBootstrapAndStartEmissions } from "./common"

interface DeployInstance {
  B3trContract: ContractFactory
  b3tr: B3TR & { deploymentTransaction(): ContractTransactionResponse }
  vot3: VOT3
  timeLock: TimeLock
  governor: B3TRGovernorV1
  galaxyMember: GalaxyMember
  x2EarnApps: X2EarnApps
  xAllocationVoting: XAllocationVoting
  xAllocationPool: XAllocationPool
  emissions: Emissions
  voterRewards: VoterRewards
  treasury: Treasury
  x2EarnRewardsPool: X2EarnRewardsPool
  nodeManagement: NodeManagement
  owner: HardhatEthersSigner
  otherAccount: HardhatEthersSigner
  minterAccount: HardhatEthersSigner
  timelockAdmin: HardhatEthersSigner
  otherAccounts: HardhatEthersSigner[]
  governorClockLogicLib: GovernorClockLogicV1
  governorConfiguratorLib: GovernorConfiguratorV1
  governorDepositLogicLib: GovernorDepositLogicV1
  governorFunctionRestrictionsLogicLib: GovernorFunctionRestrictionsLogicV1
  governorGovernanceLogicLib: GovernorGovernanceLogicV1
  governorProposalLogicLib: GovernorProposalLogicV1
  governorQuorumLogicLib: GovernorQuorumLogicV1
  governorStateLogicLib: GovernorStateLogicV1
  governorVotesLogicLib: GovernorVotesLogicV1
  myErc721: MyERC721 | undefined
  myErc1155: MyERC1155 | undefined
  vechainNodesMock: TokenAuction | undefined
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
  bootstrapAndStartEmissions = false,
  deployMocks = false,
}) => {
  if (!forceDeploy && cachedDeployInstance !== undefined) {
    return cachedDeployInstance
  }

  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount, minterAccount, timelockAdmin, ...otherAccounts] = await ethers.getSigners()

  // ---------------------- Deploy Libraries ----------------------
  // Deploy Governor Clock Logic
  const GovernorClockLogicV1 = await ethers.getContractFactory("GovernorClockLogicV1")
  const GovernorClockLogicV1Lib = await GovernorClockLogicV1.deploy()
  await GovernorClockLogicV1Lib.waitForDeployment()

  // Deploy Governor Configurator
  const GovernorConfiguratorV1 = await ethers.getContractFactory("GovernorConfiguratorV1")
  const GovernorConfiguratorV1Lib = await GovernorConfiguratorV1.deploy()
  await GovernorConfiguratorV1Lib.waitForDeployment()

  // Deploy Governor Function Restrictions Logic
  const GovernorFunctionRestrictionsLogicV1 = await ethers.getContractFactory("GovernorFunctionRestrictionsLogicV1")
  const GovernorFunctionRestrictionsLogicV1Lib = await GovernorFunctionRestrictionsLogicV1.deploy()
  await GovernorFunctionRestrictionsLogicV1Lib.waitForDeployment()

  // Deploy Governor Governance Logic
  const GovernorGovernanceLogicV1 = await ethers.getContractFactory("GovernorGovernanceLogicV1")
  const GovernorGovernanceLogicV1Lib = await GovernorGovernanceLogicV1.deploy()
  await GovernorGovernanceLogicV1Lib.waitForDeployment()

  // Deploy Governor Quorum Logic
  const GovernorQuorumLogicV1 = await ethers.getContractFactory("GovernorQuorumLogicV1", {
    libraries: {
      GovernorClockLogicV1: await GovernorClockLogicV1Lib.getAddress(),
    },
  })
  const GovernorQuorumLogicV1Lib = await GovernorQuorumLogicV1.deploy()
  await GovernorQuorumLogicV1Lib.waitForDeployment()

  // Deploy Governor Proposal Logic
  const GovernorProposalLogicV1 = await ethers.getContractFactory("GovernorProposalLogicV1", {
    libraries: {
      GovernorClockLogicV1: await GovernorClockLogicV1Lib.getAddress(),
    },
  })
  const GovernorProposalLogicV1Lib = await GovernorProposalLogicV1.deploy()
  await GovernorProposalLogicV1Lib.waitForDeployment()

  // Deploy Governor Votes Logic
  const GovernorVotesLogicV1 = await ethers.getContractFactory("GovernorVotesLogicV1", {
    libraries: {
      GovernorClockLogicV1: await GovernorClockLogicV1Lib.getAddress(),
    },
  })
  const GovernorVotesLogicV1Lib = await GovernorVotesLogicV1.deploy()
  await GovernorVotesLogicV1Lib.waitForDeployment()

  // Deploy Governor Deposit Logic
  const GovernorDepositLogicV1 = await ethers.getContractFactory("GovernorDepositLogicV1", {
    libraries: {
      GovernorClockLogicV1: await GovernorClockLogicV1Lib.getAddress(),
    },
  })
  const GovernorDepositLogicLibV1 = await GovernorDepositLogicV1.deploy()
  await GovernorDepositLogicLibV1.waitForDeployment()

  // Deploy Governor State Logic
  const GovernorStateLogicV1 = await ethers.getContractFactory("GovernorStateLogicV1", {
    libraries: {
      GovernorClockLogicV1: await GovernorClockLogicV1Lib.getAddress(),
    },
  })
  const GovernorStateLogicV1Lib = await GovernorStateLogicV1.deploy()
  await GovernorStateLogicV1Lib.waitForDeployment()

  // ---------------------- Deploy Mocks ----------------------

  // deploy Mocks
  const TokenAuctionLock = await ethers.getContractFactory("TokenAuction")
  const vechainNodesMock = await TokenAuctionLock.deploy()
  await vechainNodesMock.waitForDeployment()

  const ClockAuctionLock = await ethers.getContractFactory("ClockAuction")
  const clockAuctionContract = await ClockAuctionLock.deploy(
    await vechainNodesMock.getAddress(),
    await owner.getAddress(),
  )

  await vechainNodesMock.setSaleAuctionAddress(await clockAuctionContract.getAddress())

  await vechainNodesMock.addOperator(await owner.getAddress())

  let myErc1155, myErc721
  if (deployMocks) {
    const MyERC721 = await ethers.getContractFactory("MyERC721")
    myErc721 = await MyERC721.deploy(owner.address)
    await myErc721.waitForDeployment()

    const MyERC1155 = await ethers.getContractFactory("MyERC1155")
    myErc1155 = await MyERC1155.deploy(owner.address)
    await myErc1155.waitForDeployment()
  }

  // ---------------------- Deploy Contracts ----------------------
  // Deploy B3TR
  const B3trContract = await ethers.getContractFactory("B3TR")
  const b3tr = await B3trContract.deploy(owner, minterAccount, owner)

  // Deploy VOT3
  const vot3 = (await deployProxy("VOT3", [
    owner.address,
    owner.address,
    owner.address,
    await b3tr.getAddress(),
  ])) as VOT3

  // Deploy TimeLock
  const timeLock = (await deployProxy("TimeLock", [
    config.TIMELOCK_MIN_DELAY, //0 seconds delay for immediate execution
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
    owner.address,
    config.TREASURY_TRANSFER_LIMIT_VET,
    config.TREASURY_TRANSFER_LIMIT_B3TR,
    config.TREASURY_TRANSFER_LIMIT_VOT3,
    config.TREASURY_TRANSFER_LIMIT_VTHO,
  ])) as Treasury

  // Deploy GalaxyMember
  const galaxyMember = (await deployProxy("GalaxyMemberV1", [
    {
      name: NFT_NAME,
      symbol: NFT_SYMBOL,
      admin: owner.address,
      upgrader: owner.address,
      pauser: owner.address,
      minter: owner.address,
      contractsAddressManager: owner.address,
      maxLevel: maxMintableLevel,
      baseTokenURI: config.GM_NFT_BASE_URI,
      b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
      b3tr: await b3tr.getAddress(),
      treasury: await treasury.getAddress(),
    },
  ])) as GalaxyMemberV1

  const galaxyMemberV2 = (await upgradeProxy(
    "GalaxyMemberV1",
    "GalaxyMember",
    await galaxyMember.getAddress(),
    [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
    { version: 2 },
  )) as unknown as GalaxyMember

  // Deploy NodeManagement
  const nodeManagement = (await deployProxy("NodeManagement", [
    await vechainNodesMock.getAddress(),
    owner.address,
    owner.address,
  ])) as NodeManagement

  // Deploy X2EarnAppsV1
  const x2EarnAppsV1 = (await deployProxy("X2EarnAppsV1", [
    "ipfs://",
    [await timeLock.getAddress(), owner.address],
    owner.address,
    owner.address,
  ])) as X2EarnAppsV1

  // Upgrade X2EarnAppsV1 to X2EarnApps
  const x2EarnApps = (await upgradeProxy(
    "X2EarnAppsV1",
    "X2EarnApps",
    await x2EarnAppsV1.getAddress(),
    [config.XAPP_GRACE_PERIOD, await nodeManagement.getAddress()],
    { version: 2 },
  )) as X2EarnApps

  // Deploy X2EarnRewardsPool
  const x2EarnRewardsPoolV1 = (await deployProxy("X2EarnRewardsPoolV1", [
    owner.address,
    owner.address,
    owner.address,
    await b3tr.getAddress(),
    await x2EarnApps.getAddress(),
  ])) as X2EarnRewardsPoolV1

  // Upgrade X2EarnRewardsPool V1 to V2
  const x2EarnRewardsPool = (await upgradeProxy(
    "X2EarnRewardsPoolV1",
    "X2EarnRewardsPool",
    await x2EarnRewardsPoolV1.getAddress(),
    [],
    { version: 2 },
  )) as X2EarnRewardsPool

  // Deploy XAllocationPool
  const xAllocationPoolV1 = (await deployProxy("XAllocationPoolV1", [
    owner.address,
    owner.address,
    owner.address,
    await b3tr.getAddress(),
    await treasury.getAddress(),
    await x2EarnApps.getAddress(),
    await x2EarnRewardsPool.getAddress(),
  ])) as XAllocationPoolV1

  // Upgrade xAllocationPool V1 to V2
  const xAllocationPool = (await upgradeProxy(
    "XAllocationPoolV1",
    "XAllocationPool",
    await xAllocationPoolV1.getAddress(),
    [],
    { version: 2 },
  )) as XAllocationPool

  const X_ALLOCATIONS_ADDRESS = await xAllocationPool.getAddress()
  const VOTE_2_EARN_ADDRESS = otherAccounts[1].address

  const emissions = (await deployProxy("Emissions", [
    {
      minter: minterAccount.address,
      admin: owner.address,
      upgrader: owner.address,
      contractsAddressManager: owner.address,
      decaySettingsManager: owner.address,
      b3trAddress: await b3tr.getAddress(),
      destinations: [X_ALLOCATIONS_ADDRESS, VOTE_2_EARN_ADDRESS, await treasury.getAddress(), config.MIGRATION_ADDRESS],
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
      migrationAmount: config.MIGRATION_AMOUNT,
    },
  ])) as Emissions

  const voterRewards = (await deployProxy("VoterRewardsV1", [
    owner.address, // admin
    owner.address, // upgrader
    owner.address, // contractsAddressManager
    await emissions.getAddress(),
    await galaxyMemberV2.getAddress(),
    await b3tr.getAddress(),
    levels,
    multipliers,
  ])) as VoterRewardsV1

  const voterRewardsV2 = (await upgradeProxy("VoterRewardsV1", "VoterRewards", await voterRewards.getAddress(), [], {
    version: 2,
  })) as VoterRewards

  // Set vote 2 earn (VoterRewards deployed contract) address in emissions
  await emissions.connect(owner).setVote2EarnAddress(await voterRewardsV2.getAddress())

  // Deploy XAllocationVoting
  const xAllocationVotingV1 = (await deployProxy("XAllocationVotingV1", [
    {
      vot3Token: await vot3.getAddress(),
      quorumPercentage: config.X_ALLOCATION_VOTING_QUORUM_PERCENTAGE, // quorum percentage
      initialVotingPeriod: config.EMISSIONS_CYCLE_DURATION - 1, // X Alloc voting period
      timeLock: await timeLock.getAddress(),
      voterRewards: await voterRewards.getAddress(),
      emissions: await emissions.getAddress(),
      admins: [await timeLock.getAddress(), owner.address],
      upgrader: owner.address,
      contractsAddressManager: owner.address,
      x2EarnAppsAddress: await x2EarnApps.getAddress(),
      baseAllocationPercentage: config.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE,
      appSharesCap: config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP,
      votingThreshold: config.X_ALLOCATION_VOTING_VOTING_THRESHOLD,
    },
  ])) as XAllocationVotingV1

  // Upgrade XAllocationVoting V1 to XAllocationVoting V2
  const xAllocationVoting = (await upgradeProxy(
    "XAllocationVotingV1",
    "XAllocationVoting",
    await xAllocationVotingV1.getAddress(),
    [],
    { version: 2 },
  )) as XAllocationVoting

  // Deploy Governor
  const governor = (await deployProxy(
    "B3TRGovernorV1",
    [
      {
        vot3Token: await vot3.getAddress(),
        timelock: await timeLock.getAddress(),
        xAllocationVoting: await xAllocationVoting.getAddress(),
        b3tr: await b3tr.getAddress(),
        quorumPercentage: config.B3TR_GOVERNOR_QUORUM_PERCENTAGE, // quorum percentage
        initialDepositThreshold: config.B3TR_GOVERNOR_DEPOSIT_THRESHOLD, // deposit threshold
        initialMinVotingDelay: config.B3TR_GOVERNOR_MIN_VOTING_DELAY, // delay before vote starts
        initialVotingThreshold: config.B3TR_GOVERNOR_VOTING_THRESHOLD, // voting threshold
        voterRewards: await voterRewards.getAddress(),
        isFunctionRestrictionEnabled: true,
      },
      {
        governorAdmin: owner.address,
        pauser: owner.address,
        contractsAddressManager: owner.address,
        proposalExecutor: owner.address,
        governorFunctionSettingsRoleAddress: owner.address,
      },
    ],
    {
      GovernorClockLogicV1: await GovernorClockLogicV1Lib.getAddress(),
      GovernorConfiguratorV1: await GovernorConfiguratorV1Lib.getAddress(),
      GovernorDepositLogicV1: await GovernorDepositLogicLibV1.getAddress(),
      GovernorFunctionRestrictionsLogicV1: await GovernorFunctionRestrictionsLogicV1Lib.getAddress(),
      GovernorProposalLogicV1: await GovernorProposalLogicV1Lib.getAddress(),
      GovernorQuorumLogicV1: await GovernorQuorumLogicV1Lib.getAddress(),
      GovernorStateLogicV1: await GovernorStateLogicV1Lib.getAddress(),
      GovernorVotesLogicV1: await GovernorVotesLogicV1Lib.getAddress(),
    },
  )) as B3TRGovernorV1

  const contractAddresses: Record<string, string> = {
    B3TR: await b3tr.getAddress(),
    VoterRewards: await voterRewardsV2.getAddress(),
    Treasury: await treasury.getAddress(),
    XAllocationVoting: await xAllocationVoting.getAddress(),
    Emissions: await emissions.getAddress(),
    GalaxyMember: await galaxyMemberV2.getAddress(),
    TimeLock: await timeLock.getAddress(),
    VOT3: await vot3.getAddress(),
    XAllocationPool: await xAllocationPool.getAddress(),
    B3TRGovernorV1: await governor.getAddress(),
    X2EarnApps: await x2EarnApps.getAddress(),
  }

  const libraries = {
    B3TRGovernorV1: {
      GovernorClockLogicV1: await GovernorClockLogicV1Lib.getAddress(),
      GovernorConfiguratorV1: await GovernorConfiguratorV1Lib.getAddress(),
      GovernorDepositLogicV1: await GovernorDepositLogicLibV1.getAddress(),
      GovernorFunctionRestrictionsLogicV1: await GovernorFunctionRestrictionsLogicV1Lib.getAddress(),
      GovernorProposalLogicV1: await GovernorProposalLogicV1Lib.getAddress(),
      GovernorQuorumLogicV1: await GovernorQuorumLogicV1Lib.getAddress(),
      GovernorStateLogicV1: await GovernorStateLogicV1Lib.getAddress(),
      GovernorVotesLogicV1: await GovernorVotesLogicV1Lib.getAddress(),
    },
  }

  await setWhitelistedFunctions(contractAddresses, config, governor, owner, libraries) // Set whitelisted functions for governor proposals

  // Set up roles
  const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE()
  const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE()
  const CANCELLER_ROLE = await timeLock.CANCELLER_ROLE()
  await timeLock.connect(timelockAdmin).grantRole(PROPOSER_ROLE, await governor.getAddress())
  await timeLock.connect(timelockAdmin).grantRole(EXECUTOR_ROLE, await governor.getAddress())
  await timeLock.connect(timelockAdmin).grantRole(CANCELLER_ROLE, await governor.getAddress())

  // Set xAllocationVoting and Governor address in GalaxyMember
  await galaxyMemberV2.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
  await galaxyMemberV2.connect(owner).setB3trGovernorAddress(await governor.getAddress())

  // Grant Vote registrar role to XAllocationVoting
  await voterRewardsV2
    .connect(owner)
    .grantRole(await voterRewardsV2.VOTE_REGISTRAR_ROLE(), await xAllocationVoting.getAddress())
  // Grant Vote registrar role to Governor
  await voterRewardsV2.connect(owner).grantRole(await voterRewardsV2.VOTE_REGISTRAR_ROLE(), await governor.getAddress())

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

  // Bootstrap and start emissions
  if (bootstrapAndStartEmissions) {
    await callBootstrapAndStartEmissions()
  }

  cachedDeployInstance = {
    B3trContract,
    b3tr,
    vot3,
    timeLock,
    governor,
    galaxyMember: galaxyMemberV2,
    x2EarnApps,
    xAllocationVoting,
    xAllocationPool,
    emissions,
    voterRewards: voterRewardsV2,
    owner,
    otherAccount,
    minterAccount,
    timelockAdmin,
    otherAccounts,
    treasury,
    x2EarnRewardsPool,
    nodeManagement,
    governorClockLogicLib: GovernorClockLogicV1Lib,
    governorConfiguratorLib: GovernorConfiguratorV1Lib,
    governorDepositLogicLib: GovernorDepositLogicLibV1,
    governorFunctionRestrictionsLogicLib: GovernorFunctionRestrictionsLogicV1Lib,
    governorGovernanceLogicLib: GovernorGovernanceLogicV1Lib,
    governorProposalLogicLib: GovernorProposalLogicV1Lib,
    governorQuorumLogicLib: GovernorQuorumLogicV1Lib,
    governorStateLogicLib: GovernorStateLogicV1Lib,
    governorVotesLogicLib: GovernorVotesLogicV1Lib,
    myErc721: myErc721,
    myErc1155: myErc1155,
    vechainNodesMock: vechainNodesMock,
  }
  return cachedDeployInstance
}
