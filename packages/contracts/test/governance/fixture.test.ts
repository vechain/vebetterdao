import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import {
  B3TR,
  B3TRGovernor,
  Emissions,
  GovernorDepositLogicV1,
  GovernorProposalLogicV1,
  GovernorFunctionRestrictionsLogicV1,
  GovernorQuorumLogicV1,
  TimeLock,
  VOT3,
  VoterRewards,
  XAllocationVoting,
  GovernorClockLogicV1,
  GovernorStateLogicV1,
  GovernorVotesLogicV1,
  GovernorConfiguratorV1,
  VeBetterPassport,
  Treasury,
  GrantsManager,
} from "../../typechain-types"
import { getOrDeployContractInstances } from "../helpers"
import { ContractFactory, ContractTransactionReceipt } from "ethers"
import { ethers } from "hardhat"
import {
  bootstrapAndStartEmissions,
  createProposal,
  createProposalWithType,
  waitForCurrentRoundToEnd,
  createMultiContractProposal,
  ProposalFunction,
} from "../helpers/common"

//Constants for proposal types
export const STANDARD_PROPOSAL_TYPE = ethers.toBigInt(0)
export const GRANT_PROPOSAL_TYPE = ethers.toBigInt(1)

interface GovernanceFixture {
  governor: B3TRGovernor
  vot3: VOT3
  b3tr: B3TR
  treasury: Treasury
  owner: SignerWithAddress
  timeLock: TimeLock
  xAllocationVoting: XAllocationVoting
  voterRewards: VoterRewards
  otherAccounts: SignerWithAddress[]
  proposer: SignerWithAddress
  voter: SignerWithAddress
  emissions: Emissions
  governorClockLogicLibV1: GovernorClockLogicV1
  governorConfiguratorLibV1: GovernorConfiguratorV1
  governorDepositLogicLibV1: GovernorDepositLogicV1
  governorFunctionRestrictionsLogicLibV1: GovernorFunctionRestrictionsLogicV1
  governorProposalLogicLibV1: GovernorProposalLogicV1
  governorQuorumLogicLibV1: GovernorQuorumLogicV1
  governorStateLogicLibV1: GovernorStateLogicV1
  governorVotesLogicLibV1: GovernorVotesLogicV1
  b3trContract: ContractFactory
  veBetterPassport: VeBetterPassport
  minterAccount: SignerWithAddress
  otherAccount: SignerWithAddress
  grantsManager: GrantsManager
}

export async function setupGovernanceFixture(): Promise<GovernanceFixture> {
  const deployInstances = await getOrDeployContractInstances({
    forceDeploy: true,
  })

  //Setup deploy instances
  const governor = deployInstances?.governor
  const vot3 = deployInstances?.vot3
  const b3tr = deployInstances?.b3tr
  const treasury = deployInstances?.treasury
  const owner = deployInstances?.owner
  const timeLock = deployInstances?.timeLock
  const xAllocationVoting = deployInstances?.xAllocationVoting
  const voterRewards = deployInstances?.voterRewards
  const emissions = deployInstances?.emissions
  const governorClockLogicLibV1 = deployInstances?.governorClockLogicLibV1
  const governorConfiguratorLibV1 = deployInstances?.governorConfiguratorLibV1
  const governorDepositLogicLibV1 = deployInstances?.governorDepositLogicLibV1
  const governorFunctionRestrictionsLogicLibV1 = deployInstances?.governorFunctionRestrictionsLogicLibV1
  const governorProposalLogicLibV1 = deployInstances?.governorProposalLogicLibV1
  const governorQuorumLogicLibV1 = deployInstances?.governorQuorumLogicLibV1
  const governorStateLogicLibV1 = deployInstances?.governorStateLogicLibV1
  const governorVotesLogicLibV1 = deployInstances?.governorVotesLogicLibV1
  const b3trContract = deployInstances?.B3trContract
  const veBetterPassport = deployInstances?.veBetterPassport
  const minterAccount = deployInstances?.minterAccount
  const grantsManager = deployInstances?.grantsManager
  //Setup other accounts
  const otherAccounts = deployInstances?.otherAccounts
  const otherAccount = deployInstances?.otherAccount

  if (!otherAccounts || otherAccounts.length < 2) {
    throw new Error("Other accounts are not correctly set")
  }

  //Setup proposer and voter
  const proposer = otherAccounts[0]
  const voter = otherAccounts[1]

  if (
    !governor ||
    !vot3 ||
    !b3tr ||
    !treasury ||
    !owner ||
    !timeLock ||
    !xAllocationVoting ||
    !voterRewards ||
    !emissions ||
    !governorClockLogicLibV1 ||
    !governorConfiguratorLibV1 ||
    !governorDepositLogicLibV1 ||
    !governorFunctionRestrictionsLogicLibV1 ||
    !governorProposalLogicLibV1 ||
    !governorQuorumLogicLibV1 ||
    !governorStateLogicLibV1 ||
    !governorVotesLogicLibV1 ||
    !b3trContract ||
    !veBetterPassport ||
    !minterAccount ||
    !otherAccount ||
    !grantsManager
  ) {
    throw new Error("Deploy instances are not correctly set")
  }

  return {
    governor,
    vot3,
    b3tr,
    treasury,
    owner,
    timeLock,
    xAllocationVoting,
    voterRewards,
    otherAccounts,
    proposer,
    voter,
    emissions,
    governorClockLogicLibV1,
    governorConfiguratorLibV1,
    governorDepositLogicLibV1,
    governorFunctionRestrictionsLogicLibV1,
    governorProposalLogicLibV1,
    governorQuorumLogicLibV1,
    governorStateLogicLibV1,
    governorVotesLogicLibV1,
    b3trContract,
    veBetterPassport,
    minterAccount,
    otherAccount,
    grantsManager,
  }
}

// Common test helpers
export async function setupProposer(
  account: SignerWithAddress,
  b3tr: B3TR,
  vot3: VOT3,
  minterAccount: SignerWithAddress,
  amount: string = "1000",
) {
  await b3tr.connect(minterAccount).mint(account, ethers.parseEther(amount))
  await b3tr.connect(account).approve(await vot3.getAddress(), ethers.parseEther("9"))
  await vot3.connect(account).convertToVOT3(ethers.parseEther("9"), { gasLimit: 10_000_000 })
}

export async function startNewRoundAndGetRoundId(
  emissions: Emissions,
  xAllocationVoting: XAllocationVoting,
): Promise<string> {
  // to ensure that test will work correctly before creating a proposal we wait for current round to end
  // and start a new one
  if ((await emissions.nextCycle()) === 0n) {
    // if emissions are not started yet, we need to bootstrap and start them
    await bootstrapAndStartEmissions()
  } else {
    // otherwise we need to wait for the current round to end and start the next one
    await waitForCurrentRoundToEnd()
    await emissions.distribute()
  }
  return ((await xAllocationVoting.currentRoundId()) + 1n).toString()
}

// TODO : might be redundant
export async function createUniqueTestProposal(
  account: SignerWithAddress,
  b3tr: B3TR,
  b3trContract: ContractFactory,
  useTypeMethod: boolean = false,
  proposalType: number = 0,
) {
  const unixTimestamp = Math.floor(Date.now() / 1000)
  const blockNumber = await ethers.provider.getBlockNumber()
  const functionToCall = "tokenDetails"
  const description = `Get token details ${unixTimestamp} ${blockNumber}`

  if (useTypeMethod) {
    const tx = await createProposalWithType(
      b3tr,
      b3trContract,
      account,
      description,
      [functionToCall],
      [],
      proposalType,
    )
    return { tx, description, functionToCall }
  } else {
    const tx = await createProposal(b3tr, b3trContract, account, description, functionToCall, [])
    return { tx, description, functionToCall }
  }
}

export async function createGrantProposal(
  owner: SignerWithAddress,
  grantsManager: GrantsManager,
  treasury: Treasury,
  values: bigint[],
  proposer: SignerWithAddress,
  depositAmount: number = 0,
  description: string = "",
) {
  // Total amount of all milestones
  const totalAmount = values.reduce((sum, value) => sum + value, 0n)

  const treasuryAddress = await treasury.getAddress()
  const grantsManagerAddress = await grantsManager.getAddress()

  const transferCalldata = treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, totalAmount])
  const createMilestonesCalldata = grantsManager.interface.encodeFunctionData("createMilestones", [
    description,
    values,
    [treasuryAddress, grantsManagerAddress],
    [transferCalldata],
  ])

  // We prepare the function and the arguments to be encoded for the calldata (transferB3TR and createMilestones)
  // Issus start here ( circular dependency on the millestone calldata)
  const functions: ProposalFunction[] = [
    {
      contract: treasury,
      functionName: "transferB3TR",
      args: [grantsManagerAddress, totalAmount],
      value: 0,
    },
    {
      contract: grantsManager,
      functionName: "createMilestones",
      args: [
        description,
        values,
        [treasuryAddress, grantsManagerAddress],
        [transferCalldata, createMilestonesCalldata],
      ],
      value: 0,
    },
  ]

  // Send proposal
  const tx = await createMultiContractProposal(
    owner,
    proposer,
    functions,
    [0n, 0n],
    description,
    1, // Grant proposal type
    depositAmount,
  )

  return tx
}

export async function validateProposalEvents(
  governor: B3TRGovernor,
  receipt: ContractTransactionReceipt | null,
  expectedType: number,
  proposerAddress: string,
  description: string,
) {
  if (!receipt) {
    throw new Error("Receipt is null")
  }

  const proposalCreatedEvent = receipt?.logs[0]
  const proposalCreatedWithTypeEvent = receipt?.logs[1]

  if (!proposalCreatedEvent || !proposalCreatedWithTypeEvent) {
    throw new Error("Required events not found")
  }

  const decodedProposalCreatedEvent = governor.interface.parseLog({
    topics: [...(proposalCreatedEvent?.topics as string[])],
    data: proposalCreatedEvent.data,
  })

  const decodedProposalCreatedWithTypeEvent = governor.interface.parseLog({
    topics: [...(proposalCreatedWithTypeEvent?.topics as string[])],
    data: proposalCreatedWithTypeEvent.data,
  })

  if (!decodedProposalCreatedEvent || !decodedProposalCreatedWithTypeEvent) {
    throw new Error("Failed to decode events")
  }

  if (decodedProposalCreatedEvent.name !== "ProposalCreated") {
    throw new Error(`Expected ProposalCreated event, got ${decodedProposalCreatedEvent.name}`)
  }

  if (decodedProposalCreatedEvent.args[1] !== proposerAddress) {
    throw new Error(`Expected proposer ${proposerAddress}, got ${decodedProposalCreatedEvent.args[1]}`)
  }

  if (decodedProposalCreatedEvent.args[6] !== description) {
    throw new Error(`Expected description ${description}, got ${decodedProposalCreatedEvent.args[6]}`)
  }

  if (decodedProposalCreatedWithTypeEvent.name !== "ProposalCreatedWithType") {
    throw new Error(`Expected ProposalCreatedWithType event, got ${decodedProposalCreatedWithTypeEvent.name}`)
  }

  if (decodedProposalCreatedWithTypeEvent.args[1] !== ethers.toBigInt(expectedType)) {
    throw new Error(`Expected type ${expectedType}, got ${decodedProposalCreatedWithTypeEvent.args[1]}`)
  }

  return {
    proposalId: decodedProposalCreatedEvent.args[0],
    decodedProposalCreatedEvent,
    decodedProposalCreatedWithTypeEvent,
  }
}

export async function setupGovernanceFixtureWithEmissions(): Promise<GovernanceFixture> {
  const fixture = await setupGovernanceFixture()
  await bootstrapAndStartEmissions()
  return fixture
}
