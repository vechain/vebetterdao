import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory, ContractTransactionResponse } from "ethers"
import { ethers } from "hardhat"
import {
  B3TR,
  B3TRGovernor,
  TimeLock,
  VOT3,
  B3TRBadge,
  Emissions,
  XAllocationVoting,
  XAllocationPool,
  VoterRewards,
} from "../../typechain-types"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { deployProxy } from "../../scripts/helpers"

interface DeployInstance {
  B3trContract: ContractFactory
  b3tr: B3TR & { deploymentTransaction(): ContractTransactionResponse }
  vot3: VOT3
  timeLock: TimeLock
  governor: B3TRGovernor
  b3trBadge: B3TRBadge & { deploymentTransaction(): ContractTransactionResponse }
  xAllocationVoting: XAllocationVoting
  xAllocationPool: XAllocationPool
  emissions: Emissions
  voterRewards: VoterRewards
  owner: HardhatEthersSigner
  otherAccount: HardhatEthersSigner
  minterAccount: HardhatEthersSigner
  timelockAdmin: HardhatEthersSigner
  otherAccounts: HardhatEthersSigner[]
}

export const NFT_BADGE_NAME = "B3TRBadge"
export const NFT_BADGE_SYMBOL = "B3TR"
export const DEFAULT_MAX_MINTABLE_LEVEL = 1

// // Voter Rewards
export const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // NFT Badge levels
export const multipliers = [0, 10, 20, 50, 100, 150, 200, 400, 900, 2400] // NFT Badge percentage multipliers (in basis points)

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
  ])) as TimeLock

  // Deploy Governor
  const governor = (await deployProxy("B3TRGovernor", [
    await vot3.getAddress(),
    await timeLock.getAddress(),
    config.B3TR_GOVERNOR_QUORUM_PERCENTAGE, // quorum percentage
    config.B3TR_GOVERNOR_VOTING_PERIOD, // voting period
    config.B3TR_GOVERNOR_VOTING_DELAY, // voting delay
    config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD, // voting threshold
  ])) as B3TRGovernor

  // Set up roles
  const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE()
  const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE()
  const CANCELLER_ROLE = await timeLock.CANCELLER_ROLE()
  await timeLock.connect(timelockAdmin).grantRole(PROPOSER_ROLE, await governor.getAddress())
  await timeLock.connect(timelockAdmin).grantRole(EXECUTOR_ROLE, await governor.getAddress())
  await timeLock.connect(timelockAdmin).grantRole(CANCELLER_ROLE, await governor.getAddress())

  // Deploy NFTBadge
  const NFTBadgeContract = await ethers.getContractFactory("B3TRBadge")
  const b3trBadge = await NFTBadgeContract.deploy(
    NFT_BADGE_NAME,
    NFT_BADGE_SYMBOL,
    owner,
    maxMintableLevel,
    config.NFT_BADGE_BASE_URI,
    config.NFT_BADGE_X_NODE_UPGRADEABLE_LEVELS,
    config.NFT_BADGE_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
    await b3tr.getAddress(),
    config.TREASURY_POOL_ADDRESS,
  )
  await b3trBadge.waitForDeployment()

  // Deploy XAllocationPool
  const xAllocationPool = (await deployProxy("XAllocationPool", [
    owner.address,
    await b3tr.getAddress(),
    config.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE,
    config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP,
  ])) as XAllocationPool

  const X_ALLOCATIONS_ADDRESS = await xAllocationPool.getAddress()
  const VOTE_2_EARN_ADDRESS = otherAccounts[1].address
  const TREASURY_ADDRESS = otherAccounts[2].address

  const emissions = (await deployProxy("Emissions", [
    {
      minter: minterAccount.address,
      admin: owner.address,
      upgrader: owner.address,
      b3trAddress: await b3tr.getAddress(),
      destinations: [X_ALLOCATIONS_ADDRESS, VOTE_2_EARN_ADDRESS, TREASURY_ADDRESS],
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
    await emissions.getAddress(),
    await b3trBadge.getAddress(),
    await b3tr.getAddress(),
    levels,
    multipliers,
  ])) as VoterRewards

  // Set vote 2 earn (VoterRewards deployed contract) address in emissions
  await emissions.connect(owner).setVote2EarnAddress(await voterRewards.getAddress())

  // Deploy XAllocationVoting
  const xAllocationVoting = (await deployProxy("XAllocationVoting", [
    await vot3.getAddress(),
    config.X_ALLOCATION_VOTING_QUORUM_PERCENTAGE, // quorum percentage
    config.EMISSIONS_CYCLE_DURATION - 1, // X Alloc voting period
    await timeLock.getAddress(),
    await voterRewards.getAddress(),
    [await timeLock.getAddress(), owner.address],
    "ipfs://",
  ])) as XAllocationVoting

  // Set xAllocationVoting and Governor address in B3TRBadge
  await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
  await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())

  // Grant Vote registrar role to XAllocationVoting
  await voterRewards.connect(owner).setXallocationVoteRegistrarRole(await xAllocationVoting.getAddress())

  // Grant admin role to voter rewards for registering x allocation voting
  await xAllocationVoting.connect(owner).setAdminRole(await emissions.getAddress())

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
    b3trBadge,
    xAllocationVoting,
    xAllocationPool,
    emissions,
    voterRewards,
    owner,
    otherAccount,
    minterAccount,
    timelockAdmin,
    otherAccounts,
  }
  return cachedDeployInstance
}
