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
} from "../../typechain-types"
import { getOrDeployContractInstances } from "../helpers"
import { ContractFactory } from "ethers"

interface GovernanceFixture {
  governor: B3TRGovernor
  vot3: VOT3
  b3tr: B3TR
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
}

export async function setupGovernanceFixture(): Promise<GovernanceFixture> {
  const deployInstances = await getOrDeployContractInstances({
    forceDeploy: true,
  })

  //Setup deploy instances
  const governor = deployInstances?.governor
  const vot3 = deployInstances?.vot3
  const b3tr = deployInstances?.b3tr
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
    !otherAccount
  ) {
    throw new Error("Deploy instances are not correctly set")
  }

  return {
    governor,
    vot3,
    b3tr,
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
  }
}
