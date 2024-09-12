import { ethers } from "hardhat"

export const getGovernorLibrariesV1 = async () => {
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
  const GovernorDepositLogicV1Lib = await GovernorDepositLogicV1.deploy()
  await GovernorDepositLogicV1Lib.waitForDeployment()

  // Deploy Governor State Logic
  const GovernorStateLogicV1 = await ethers.getContractFactory("GovernorStateLogicV1", {
    libraries: {
      GovernorClockLogicV1: await GovernorClockLogicV1Lib.getAddress(),
    },
  })
  const GovernorStateLogicV1Lib = await GovernorStateLogicV1.deploy()
  await GovernorStateLogicV1Lib.waitForDeployment()

  return {
    GovernorClockLogicV1: await GovernorClockLogicV1Lib.getAddress(),
    GovernorConfiguratorV1: await GovernorConfiguratorV1Lib.getAddress(),
    GovernorDepositLogicV1: await GovernorDepositLogicV1Lib.getAddress(),
    GovernorFunctionRestrictionsLogicV1: await GovernorFunctionRestrictionsLogicV1Lib.getAddress(),
    GovernorProposalLogicV1: await GovernorProposalLogicV1Lib.getAddress(),
    GovernorQuorumLogicV1: await GovernorQuorumLogicV1Lib.getAddress(),
    GovernorStateLogicV1: await GovernorStateLogicV1Lib.getAddress(),
    GovernorVotesLogicV1: await GovernorVotesLogicV1Lib.getAddress(),
  }
}
