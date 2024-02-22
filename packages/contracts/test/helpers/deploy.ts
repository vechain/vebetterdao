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

interface DeployInstance {
  B3trContract: ContractFactory
  b3tr: B3TR & { deploymentTransaction(): ContractTransactionResponse }
  vot3: VOT3 & { deploymentTransaction(): ContractTransactionResponse }
  timeLock: TimeLock & { deploymentTransaction(): ContractTransactionResponse }
  governor: B3TRGovernor & { deploymentTransaction(): ContractTransactionResponse }
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

export const NFT_BADGE_NAME = "B3TRBadge"
export const NFT_BADGE_SYMBOL = "B3TR"
export const DEFAULT_MAX_MINTABLE_LEVEL = 1

// // Voter Rewards
export const levels = [1, 2, 3, 4] // NFT Badge levels
export const multipliers = [0, 10, 20, 50] // NFT Badge percentage multipliers

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
  const b3tr = await B3trContract.deploy(minterAccount, config.B3TR_CAP)

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
  const B3TRGovernor = await ethers.getContractFactory("B3TRGovernor")
  const governor = await B3TRGovernor.deploy(
    await vot3.getAddress(),
    await timeLock.getAddress(),
    config.B3TR_GOVERNOR_QUORUM_PERCENTAGE, // quorum percentage
    config.B3TR_GOVERNOR_VOTING_PERIOD, // voting period
    config.B3TR_GOVERNOR_VOTING_DELAY, // voting delay
    config.B3TR_GOVERNOR_PROPOSAL_THRESHOLD, // voting threshold
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
  const b3trBadge = await NFTBadgeContract.deploy(
    NFT_BADGE_NAME,
    NFT_BADGE_SYMBOL,
    owner,
    maxMintableLevel,
    config.NFT_BADGE_BASE_URI,
  )
  await b3trBadge.waitForDeployment()

  // Deploy XAllocationPool
  const XAllocationPoolContract = await ethers.getContractFactory("XAllocationPool")
  const xAllocationPool = await XAllocationPoolContract.deploy(
    owner.address,
    await b3tr.getAddress(),
    config.X_ALLOCATION_POOL_BASE_ALLOCATION_PERCENTAGE,
    config.X_ALLOCATION_POOL_APP_SHARES_MAX_CAP,
  )
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
    config.INITIAL_X_ALLOCATION,
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
    config.B3TR_GOVERNOR_QUORUM_PERCENTAGE, // quorum percentage
    config.EMISSIONS_CYCLE_DURATION - 1, // X Alloc voting period
    await timeLock.getAddress(),
    await voterRewards.getAddress(),
    [await timeLock.getAddress(), owner.address],
    "ipfs://",
  )
  await xAllocationVoting.waitForDeployment()

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
