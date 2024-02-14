import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory, ContractTransactionResponse } from "ethers"
import { ethers } from "hardhat"
import {
  B3TR,
  GovernorContract,
  TimeLock,
  VOT3,
  B3TRBadge,
  Emissions,
  XAllocationVoting,
  XAllocationPool,
  VoterRewards,
} from "../../typechain-types"

interface DeployInstance {
  B3trContract: ContractFactory
  b3tr: B3TR & { deploymentTransaction(): ContractTransactionResponse }
  vot3: VOT3 & { deploymentTransaction(): ContractTransactionResponse }
  timeLock: TimeLock & { deploymentTransaction(): ContractTransactionResponse }
  governor: GovernorContract & { deploymentTransaction(): ContractTransactionResponse }
  b3trBadge: B3TRBadge & { deploymentTransaction(): ContractTransactionResponse }
  xAllocationVoting: XAllocationVoting & { deploymentTransaction(): ContractTransactionResponse }
  xAllocationPool: XAllocationPool & { deploymentTransaction(): ContractTransactionResponse }
  emissions: Emissions & { deploymentTransaction(): ContractTransactionResponse }
  voterRewards: VoterRewards & { deploymentTransaction(): ContractTransactionResponse }
  owner: HardhatEthersSigner
  otherAccount: HardhatEthersSigner
  minterAccount: HardhatEthersSigner
  timelockAdmin: HardhatEthersSigner
  otherAccounts: HardhatEthersSigner[]
}

export const defaultVotingPeriod = 15
export const defaultVotingTreshold = 0
export const defaultVotingDelay = 1

export const NFT_BADGE_NAME = "B3TRBadge"
export const NFT_BADGE_SYMBOL = "B3TR"
export const DEFAULT_MAX_MINTABLE_LEVEL = 1

export const PRE_MINT_X_ALLOCATION = ethers.parseEther("1000000")
export const PRE_MINT_VOTE_2_EARN_ALLOCATION = ethers.parseEther("1000000")
export const PRE_MINT_TREASURY_ALLOCATION = ethers.parseEther("1750000")

export const CYCLE_DURATION = 20 // 20 blocks. For testing purposes
export const DECAY_SETTINGS = [4, 20, 12, 50] // 4% decay for X Allocations, 20% decay for Vote2Earn, every 12 cycles for X Allocations, Every 50 cycles for Vote2Earn
export const INITIAL_EMISSIONS = ethers.parseEther("2000000")
export const TREASURY_PERCENTAGE = 25 // 25%
export const LAST_EMISSIONS = [66, 13] // On the last cycle, 66% of the emissions will be sent to the x allocations address, 13% to the vote 2 earn address

// Voter Rewards
export const levels = [1, 2, 3, 4] // NFT Badge levels
export const multipliers = [0, 10, 20, 50] // NFT Badge percentage multipliers

let cachedDeployInstance: DeployInstance | undefined = undefined
export const getOrDeployContractInstances = async ({
  forceDeploy = false,
  votingTreshold = defaultVotingTreshold,
  votingPeriod = defaultVotingPeriod,
  xAllocationVotingPeriod = CYCLE_DURATION - 1,
  maxMintableLevel = DEFAULT_MAX_MINTABLE_LEVEL,
  cycleDuration = CYCLE_DURATION,
}) => {
  if (!forceDeploy && cachedDeployInstance !== undefined) {
    return cachedDeployInstance
  }

  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount, minterAccount, timelockAdmin, ...otherAccounts] = await ethers.getSigners()

  // Deploy B3TR
  const B3trContract = await ethers.getContractFactory("B3TR")
  const b3tr = await B3trContract.deploy(minterAccount)

  // Deploy VOT3
  const Vot3Contract = await ethers.getContractFactory("VOT3")
  const vot3 = await Vot3Contract.deploy(await b3tr.getAddress())

  // Deploy TimeLock
  const TimeLockContract = await ethers.getContractFactory("TimeLock")
  const timeLock = await TimeLockContract.deploy(
    0, //0 seconds delay for immediate execution
    [],
    [],
    timelockAdmin,
  )

  // Deploy Governor
  const GovernorContract = await ethers.getContractFactory("GovernorContract")
  const governor = await GovernorContract.deploy(
    await vot3.getAddress(),
    await timeLock.getAddress(),
    4, // quroum percentage
    votingPeriod, // voting period
    defaultVotingDelay, // voting delay
    votingTreshold, // voting treshold
  )
  await governor.waitForDeployment()

  // Set up roles
  const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE()
  const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE()
  const CANCELLER_ROLE = await timeLock.CANCELLER_ROLE()
  await timeLock.connect(timelockAdmin).grantRole(PROPOSER_ROLE, await governor.getAddress())
  await timeLock.connect(timelockAdmin).grantRole(EXECUTOR_ROLE, await governor.getAddress())
  await timeLock.connect(timelockAdmin).grantRole(CANCELLER_ROLE, await governor.getAddress())

  // Deploy NFTBadge
  const NFTBadgeContract = await ethers.getContractFactory("B3TRBadge")
  const b3trBadge = await NFTBadgeContract.deploy(NFT_BADGE_NAME, NFT_BADGE_SYMBOL, owner, maxMintableLevel)
  await b3trBadge.waitForDeployment()

  // Deploy XAllocationPool
  const XAllocationPoolContract = await ethers.getContractFactory("XAllocationPool")
  const xAllocationPool = await XAllocationPoolContract.deploy(owner.address, await b3tr.getAddress())
  await xAllocationPool.waitForDeployment()

  const X_ALLOCATIONS_ADDRESS = await xAllocationPool.getAddress()
  const VOTE_2_EARN_ADDRESS = otherAccounts[1].address
  const TREASURY_ADDRESS = otherAccounts[2].address

  const EmissionsContract = await ethers.getContractFactory("Emissions")
  const emissions = await EmissionsContract.deploy(
    minterAccount,
    owner,
    await b3tr.getAddress(),
    [X_ALLOCATIONS_ADDRESS, VOTE_2_EARN_ADDRESS, TREASURY_ADDRESS],
    [PRE_MINT_X_ALLOCATION, PRE_MINT_VOTE_2_EARN_ALLOCATION, PRE_MINT_TREASURY_ALLOCATION],
    cycleDuration,
    DECAY_SETTINGS as [number, number, number, number],
    INITIAL_EMISSIONS,
    TREASURY_PERCENTAGE,
    LAST_EMISSIONS as [number, number],
  )

  await emissions.waitForDeployment()

  const VoterRewardsContract = await ethers.getContractFactory("VoterRewards")
  const voterRewards = await VoterRewardsContract.deploy(
    owner,
    await emissions.getAddress(),
    await b3trBadge.getAddress(),
    await b3tr.getAddress(),
    levels,
    multipliers,
  )
  await voterRewards.waitForDeployment()

  // Set vote 2 earn (VoterRewards deployed contract) address in emissions
  await emissions.connect(owner).setVote2EarnAddress(await voterRewards.getAddress())

  // Deploy XAllocationVoting
  const XAllocationVotingContract = await ethers.getContractFactory("XAllocationVoting")
  const xAllocationVoting = await XAllocationVotingContract.deploy(
    await vot3.getAddress(),
    4, // quroum percentage
    xAllocationVotingPeriod, // voting period
    0, // voting delay
    await timeLock.getAddress(),
    await voterRewards.getAddress(),
    [await timeLock.getAddress(), owner.address],
  )
  await xAllocationVoting.waitForDeployment()

  // Grant Vote registrar role to XAllocationVoting
  await voterRewards.connect(owner).setXallocationVoteRegistrarRole(await xAllocationVoting.getAddress())

  // Grant admin role to voter rewards for registering x allocation voting
  await xAllocationVoting.connect(owner).setAdminRole(await emissions.getAddress())

  // Set xAllocationGovernor in emissions
  await emissions.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

  // Setup XAllocationPool addresses
  await xAllocationPool.connect(owner).setXAllocationVotingAddress(await xAllocationVoting.getAddress())
  await xAllocationPool.connect(owner).setEmissionsAddress(await emissions.getAddress())

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
