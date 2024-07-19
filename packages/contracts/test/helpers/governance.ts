import { B3TRGovernorV2 } from "./../../typechain-types"
import { ethers } from "hardhat"
import { getOrDeployContractInstances } from "./deploy"
import {
  bootstrapAndStartEmissions,
  getProposalIdFromTx,
  getVot3Tokens,
  waitForProposalToBeActive,
  waitForVotingPeriodToEnd,
} from "./common"

export const upgradeGovernanceToV2 = async (): Promise<B3TRGovernorV2> => {
  const { governor, xAllocationVoting, otherAccount, owner } = await getOrDeployContractInstances({})

  ////////////////////////////

  // ---------------------- Deploy Libraries V2 ----------------------
  // Deploy Governor Clock Logic
  const GovernorClockLogicV2 = await ethers.getContractFactory("GovernorClockLogicV2")
  const GovernorClockLogicLibV2 = await GovernorClockLogicV2.deploy()
  await GovernorClockLogicLibV2.waitForDeployment()

  // Deploy Governor Configurator
  const GovernorConfiguratorV2 = await ethers.getContractFactory("GovernorConfiguratorV2")
  const GovernorConfiguratorLibV2 = await GovernorConfiguratorV2.deploy()
  await GovernorConfiguratorLibV2.waitForDeployment()

  // Deploy Governor Function Restrictions Logic
  const GovernorFunctionRestrictionsLogicV2 = await ethers.getContractFactory("GovernorFunctionRestrictionsLogicV2")
  const GovernorFunctionRestrictionsLogicLibV2 = await GovernorFunctionRestrictionsLogicV2.deploy()
  await GovernorFunctionRestrictionsLogicLibV2.waitForDeployment()

  // Deploy Governor Governance Logic
  const GovernorGovernanceLogicV2 = await ethers.getContractFactory("GovernorGovernanceLogicV2")
  const GovernorGovernanceLogicLibV2 = await GovernorGovernanceLogicV2.deploy()
  await GovernorGovernanceLogicLibV2.waitForDeployment()

  // Deploy Governor Quorum Logic
  const GovernorQuorumLogicV2 = await ethers.getContractFactory("GovernorQuorumLogicV2", {
    libraries: {
      GovernorClockLogicV2: await GovernorClockLogicLibV2.getAddress(),
    },
  })
  const GovernorQuorumLogicLibV2 = await GovernorQuorumLogicV2.deploy()
  await GovernorQuorumLogicLibV2.waitForDeployment()

  // Deploy Governor Proposal Logic
  const GovernorProposalLogicV2 = await ethers.getContractFactory("GovernorProposalLogicV2", {
    libraries: {
      GovernorClockLogicV2: await GovernorClockLogicLibV2.getAddress(),
    },
  })
  const GovernorProposalLogicLibV2 = await GovernorProposalLogicV2.deploy()
  await GovernorProposalLogicLibV2.waitForDeployment()

  // Deploy Governor Votes Logic
  const GovernorVotesLogicV2 = await ethers.getContractFactory("GovernorVotesLogicV2", {
    libraries: {
      GovernorClockLogicV2: await GovernorClockLogicLibV2.getAddress(),
    },
  })
  const GovernorVotesLogicLibV2 = await GovernorVotesLogicV2.deploy()
  await GovernorVotesLogicLibV2.waitForDeployment()

  // Deploy Governor Deposit Logic
  const GovernorDepositLogicV2 = await ethers.getContractFactory("GovernorDepositLogicV2", {
    libraries: {
      GovernorClockLogicV2: await GovernorClockLogicLibV2.getAddress(),
    },
  })
  const GovernorDepositLogicLibV2 = await GovernorDepositLogicV2.deploy()
  await GovernorDepositLogicLibV2.waitForDeployment()

  // Deploy Governor State Logic
  const GovernorStateLogicV2 = await ethers.getContractFactory("GovernorStateLogicV2", {
    libraries: {
      GovernorClockLogicV2: await GovernorClockLogicLibV2.getAddress(),
    },
  })
  const GovernorStateLogicLibV2 = await GovernorStateLogicV2.deploy()
  await GovernorStateLogicLibV2.waitForDeployment()

  // Start emissions
  await bootstrapAndStartEmissions()

  const B3TRGovernorV2 = await ethers.getContractFactory("B3TRGovernorV2", {
    libraries: {
      GovernorClockLogicV2: await GovernorClockLogicLibV2.getAddress(),
      GovernorConfiguratorV2: await GovernorConfiguratorLibV2.getAddress(),
      GovernorDepositLogicV2: await GovernorDepositLogicLibV2.getAddress(),
      GovernorFunctionRestrictionsLogicV2: await GovernorFunctionRestrictionsLogicLibV2.getAddress(),
      GovernorProposalLogicV2: await GovernorProposalLogicLibV2.getAddress(),
      GovernorQuorumLogicV2: await GovernorQuorumLogicLibV2.getAddress(),
      GovernorStateLogicV2: await GovernorStateLogicLibV2.getAddress(),
      GovernorVotesLogicV2: await GovernorVotesLogicLibV2.getAddress(),
    },
  })

  const newGovernor = await B3TRGovernorV2.deploy()
  await newGovernor.waitForDeployment()

  const V1Contract = await ethers.getContractAt("B3TRGovernor", await governor.getAddress())

  // Now we can create a proposal
  const encodedFunctionCall = V1Contract.interface.encodeFunctionData("upgradeToAndCall", [
    await newGovernor.getAddress(),
    "0x",
  ])

  const descriptionUpgrade = "Upgrading Governance contracts"
  const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(descriptionUpgrade))
  const currentRoundId = await xAllocationVoting.currentRoundId()

  const txGovernorUpgrade = await governor
    .connect(owner)
    .propose([await governor.getAddress()], [0], [encodedFunctionCall], descriptionUpgrade, currentRoundId + 1n, 0, {
      gasLimit: 10_000_000,
    })

  const proposalIdGovernor = await getProposalIdFromTx(txGovernorUpgrade)

  await getVot3Tokens(otherAccount, "10000")

  await waitForProposalToBeActive(proposalIdGovernor)

  await governor.connect(otherAccount).castVote(proposalIdGovernor, 1)
  await waitForVotingPeriodToEnd(proposalIdGovernor)

  await governor.queue([await governor.getAddress()], [0], [encodedFunctionCall], descriptionHash)

  await governor.execute([await governor.getAddress()], [0], [encodedFunctionCall], descriptionHash)

  // Check that the new implementation works
  const governorV2 = B3TRGovernorV2.attach(await governor.getAddress()) as B3TRGovernorV2

  return governorV2
}
