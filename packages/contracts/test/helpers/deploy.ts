import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { ContractFactory, ContractTransactionResponse } from "ethers"
import { ethers } from "hardhat"
import {
  B3TR,
  GovernorContract,
  TimeLock,
  VOT3,
  B3TRBadge,
  XAllocationVoting,
  XAllocationPool,
} from "../../typechain-types"
import { time } from "@nomicfoundation/hardhat-network-helpers"

interface DeployInstance {
  B3trContract: ContractFactory
  b3tr: B3TR & { deploymentTransaction(): ContractTransactionResponse }
  vot3: VOT3 & { deploymentTransaction(): ContractTransactionResponse }
  timeLock: TimeLock & { deploymentTransaction(): ContractTransactionResponse }
  governor: GovernorContract & { deploymentTransaction(): ContractTransactionResponse }
  b3trBadge: B3TRBadge & { deploymentTransaction(): ContractTransactionResponse }
  xAllocationVoting: XAllocationVoting & { deploymentTransaction(): ContractTransactionResponse }
  xAllocationPool: XAllocationPool & { deploymentTransaction(): ContractTransactionResponse }
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

let cachedDeployInstance: DeployInstance | undefined = undefined
export const getOrDeployContractInstances = async ({
  forceDeploy = false,
  votingTreshold = defaultVotingTreshold,
  votingPeriod = defaultVotingPeriod,
  maxMintableLevel = DEFAULT_MAX_MINTABLE_LEVEL,
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
  const xAllocationPool = await XAllocationPoolContract.deploy([await timeLock.getAddress(), owner.address])
  await xAllocationPool.waitForDeployment()

  // Deploy XAllocationVoting
  const XAllocationVotingContract = await ethers.getContractFactory("XAllocationVoting")
  const xAllocationVoting = await XAllocationVotingContract.deploy(
    await vot3.getAddress(),
    4, // quroum percentage
    votingPeriod, // voting period
    0, // voting delay
    await timeLock.getAddress(),
    await xAllocationPool.getAddress(),
  )
  await xAllocationVoting.waitForDeployment()

  cachedDeployInstance = {
    B3trContract,
    b3tr,
    vot3,
    timeLock,
    governor,
    b3trBadge,
    xAllocationVoting,
    xAllocationPool,
    owner,
    otherAccount,
    minterAccount,
    timelockAdmin,
    otherAccounts,
  }
  return cachedDeployInstance
}
