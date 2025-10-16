import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { deployAndUpgrade, deployProxyOnly, initializeProxy, upgradeProxy } from "../../scripts/helpers"
import {
  B3TRGovernor,
  B3TRGovernorV1,
  B3TRGovernorV2,
  B3TRGovernorV3,
  B3TRGovernorV4,
  B3TRGovernorV5,
  B3TRGovernorV6,
  B3TRGovernorV7,
} from "../../typechain-types"
import { DeployInstance, getOrDeployContractInstances } from "../helpers"
import {
  getProposalIdFromTx,
  getVot3Tokens,
  startNewAllocationRound,
  waitForBlock,
  waitForCurrentRoundToEnd,
  waitForNextBlock,
} from "../helpers/common"
import { GRANT_PROPOSAL_TYPE, setupProposer, STANDARD_PROPOSAL_TYPE, startNewRoundAndGetRoundId } from "./fixture.test"

describe("Governance - V8 Upgrade - @shard4fg", function () {
  it("Should preserve proposal data through version upgrades and add proposal state in development support", async () => {
    const config = createLocalConfig()
    const {
      owner,
      b3tr,
      timeLock,
      voterRewards,
      vot3,
      xAllocationVoting,
      governorClockLogicLibV1,
      governorConfiguratorLibV1,
      governorDepositLogicLibV1,
      governorFunctionRestrictionsLogicLibV1,
      governorProposalLogicLibV1,
      governorQuorumLogicLibV1,
      governorStateLogicLibV1,
      governorVotesLogicLibV1,
      governorClockLogicLibV3,
      governorConfiguratorLibV3,
      governorDepositLogicLibV3,
      governorFunctionRestrictionsLogicLibV3,
      governorProposalLogicLibV3,
      governorQuorumLogicLibV3,
      governorStateLogicLibV3,
      governorVotesLogicLibV3,
      governorClockLogicLibV4,
      governorConfiguratorLibV4,
      governorDepositLogicLibV4,
      governorFunctionRestrictionsLogicLibV4,
      governorProposalLogicLibV4,
      governorQuorumLogicLibV4,
      governorStateLogicLibV4,
      governorVotesLogicLibV4,
      governorClockLogicLibV5,
      governorConfiguratorLibV5,
      governorDepositLogicLibV5,
      governorFunctionRestrictionsLogicLibV5,
      governorProposalLogicLibV5,
      governorQuorumLogicLibV5,
      governorStateLogicLibV5,
      governorVotesLogicLibV5,
      governorClockLogicLibV6,
      governorConfiguratorLibV6,
      governorDepositLogicLibV6,
      governorFunctionRestrictionsLogicLibV6,
      governorProposalLogicLibV6,
      governorQuorumLogicLibV6,
      governorStateLogicLibV6,
      governorVotesLogicLibV6,
      governorClockLogicLibV7,
      governorConfiguratorLibV7,
      governorDepositLogicLibV7,
      governorFunctionRestrictionsLogicLibV7,
      governorProposalLogicLibV7,
      governorQuorumLogicLibV7,
      governorStateLogicLibV7,
      governorVotesLogicLibV7,
      governorConfiguratorLib,
      governorDepositLogicLib,
      governorFunctionRestrictionsLogicLib,
      governorProposalLogicLib,
      governorQuorumLogicLib,
      governorStateLogicLib,
      governorVotesLogicLib,
      governorClockLogicLib,
      veBetterPassport,
      minterAccount,
      otherAccounts,
      emissions,
      grantsManager,
      galaxyMember,
    } = (await getOrDeployContractInstances({
      forceDeploy: true,
    })) as DeployInstance

    // Setup proposer for this test
    const proposer = otherAccounts[0]
    await setupProposer(proposer, b3tr, vot3, minterAccount)

    // Deploy V1 Governor Proxy
    const governorContractAddress = await deployProxyOnly("B3TRGovernorV1", {
      GovernorClockLogicV1: await governorClockLogicLibV1.getAddress(),
      GovernorConfiguratorV1: await governorConfiguratorLibV1.getAddress(),
      GovernorDepositLogicV1: await governorDepositLogicLibV1.getAddress(),
      GovernorFunctionRestrictionsLogicV1: await governorFunctionRestrictionsLogicLibV1.getAddress(),
      GovernorProposalLogicV1: await governorProposalLogicLibV1.getAddress(),
      GovernorQuorumLogicV1: await governorQuorumLogicLibV1.getAddress(),
      GovernorStateLogicV1: await governorStateLogicLibV1.getAddress(),
      GovernorVotesLogicV1: await governorVotesLogicLibV1.getAddress(),
    })

    // Initialize V1
    const governorV1 = (await initializeProxy(
      governorContractAddress,
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
        GovernorClockLogicV1: await governorClockLogicLibV1.getAddress(),
        GovernorConfiguratorV1: await governorConfiguratorLibV1.getAddress(),
        GovernorDepositLogicV1: await governorDepositLogicLibV1.getAddress(),
        GovernorFunctionRestrictionsLogicV1: await governorFunctionRestrictionsLogicLibV1.getAddress(),
        GovernorProposalLogicV1: await governorProposalLogicLibV1.getAddress(),
        GovernorQuorumLogicV1: await governorQuorumLogicLibV1.getAddress(),
        GovernorStateLogicV1: await governorStateLogicLibV1.getAddress(),
        GovernorVotesLogicV1: await governorVotesLogicLibV1.getAddress(),
      },
    )) as B3TRGovernorV1

    expect(await governorV1.version()).to.equal("1")

    const roundIdforV1 = await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

    const txV1 = await governorV1.connect(proposer).propose([], [], [], "descriptionV1", roundIdforV1, 0, {
      gasLimit: 10_000_000,
    })
    const proposeReceiptV1 = await txV1.wait()
    const eventV1 = proposeReceiptV1?.logs[0]

    const decodedV1Logs = governorV1.interface.parseLog({
      topics: [...(eventV1?.topics as string[])],
      data: eventV1 ? eventV1.data : "",
    })

    const proposalIdV1 = ethers.toBigInt(decodedV1Logs?.args[0])

    // Verify proposal exists and get initial data
    const proposerV1 = await governorV1.proposalProposer(proposalIdV1)
    const stateV1 = await governorV1.state(proposalIdV1)

    expect(proposerV1).to.equal(proposer.address)
    expect(stateV1).to.equal(ethers.toBigInt(0)) // Pending state

    // Upgrade V1 -> V2
    const governorV2 = (await upgradeProxy("B3TRGovernorV1", "B3TRGovernorV2", governorContractAddress, [], {
      version: 2,
      libraries: {
        GovernorClockLogicV1: await governorClockLogicLibV1.getAddress(),
        GovernorConfiguratorV1: await governorConfiguratorLibV1.getAddress(),
        GovernorDepositLogicV1: await governorDepositLogicLibV1.getAddress(),
        GovernorFunctionRestrictionsLogicV1: await governorFunctionRestrictionsLogicLibV1.getAddress(),
        GovernorProposalLogicV1: await governorProposalLogicLibV1.getAddress(),
        GovernorQuorumLogicV1: await governorQuorumLogicLibV1.getAddress(),
        GovernorStateLogicV1: await governorStateLogicLibV1.getAddress(),
        GovernorVotesLogicV1: await governorVotesLogicLibV1.getAddress(),
      },
    })) as B3TRGovernorV2

    const roundIdforV2 = await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

    const txV2 = await governorV2.connect(proposer).propose([], [], [], "descriptionV2", roundIdforV2, 0, {
      gasLimit: 10_000_000,
    })
    const proposeReceiptV2 = await txV2.wait()
    const eventV2 = proposeReceiptV2?.logs[0]

    const decodedV2Logs = governorV2.interface.parseLog({
      topics: [...(eventV2?.topics as string[])],
      data: eventV2 ? eventV2.data : "",
    })

    const proposalIdV2 = ethers.toBigInt(decodedV2Logs?.args[0])

    // Verify proposal exists and get initial data
    const proposerV2 = await governorV2.proposalProposer(proposalIdV2)
    const stateV2 = await governorV2.state(proposalIdV2)

    expect(proposerV2).to.equal(proposer.address)
    expect(stateV2).to.equal(ethers.toBigInt(0)) // Pending state

    // Upgrade V2 -> V3
    const governorV3 = (await upgradeProxy("B3TRGovernorV2", "B3TRGovernorV3", governorContractAddress, [], {
      version: 3,
      libraries: {
        GovernorClockLogicV3: await governorClockLogicLibV3.getAddress(),
        GovernorConfiguratorV3: await governorConfiguratorLibV3.getAddress(),
        GovernorDepositLogicV3: await governorDepositLogicLibV3.getAddress(),
        GovernorFunctionRestrictionsLogicV3: await governorFunctionRestrictionsLogicLibV3.getAddress(),
        GovernorProposalLogicV3: await governorProposalLogicLibV3.getAddress(),
        GovernorQuorumLogicV3: await governorQuorumLogicLibV3.getAddress(),
        GovernorStateLogicV3: await governorStateLogicLibV3.getAddress(),
        GovernorVotesLogicV3: await governorVotesLogicLibV3.getAddress(),
      },
    })) as B3TRGovernorV3

    expect(await governorV3.version()).to.equal("3")

    // Verify both proposals persisted through V2 -> V3 upgrade
    expect(await governorV3.proposalProposer(proposalIdV1)).to.equal(proposerV1)
    expect(await governorV3.state(proposalIdV1)).to.equal(ethers.toBigInt(7)) //At this stage should be a failed proposal
    expect(await governorV3.proposalProposer(proposalIdV2)).to.equal(proposer.address)
    expect(await governorV3.state(proposalIdV2)).to.equal(ethers.toBigInt(0))

    // Upgrade V3 -> V4
    const governorV4 = (await upgradeProxy(
      "B3TRGovernorV3",
      "B3TRGovernorV4",
      governorContractAddress,
      [await veBetterPassport.getAddress()],
      {
        version: 4,
        libraries: {
          GovernorClockLogicV4: await governorClockLogicLibV4.getAddress(),
          GovernorConfiguratorV4: await governorConfiguratorLibV4.getAddress(),
          GovernorDepositLogicV4: await governorDepositLogicLibV4.getAddress(),
          GovernorFunctionRestrictionsLogicV4: await governorFunctionRestrictionsLogicLibV4.getAddress(),
          GovernorProposalLogicV4: await governorProposalLogicLibV4.getAddress(),
          GovernorQuorumLogicV4: await governorQuorumLogicLibV4.getAddress(),
          GovernorStateLogicV4: await governorStateLogicLibV4.getAddress(),
          GovernorVotesLogicV4: await governorVotesLogicLibV4.getAddress(),
        },
      },
    )) as B3TRGovernorV4

    expect(await governorV4.version()).to.equal("4")

    // Verify all proposals persisted through V3 -> V4 upgrade
    expect(await governorV4.proposalProposer(proposalIdV1)).to.equal(proposerV1)
    expect(await governorV4.state(proposalIdV1)).to.equal(ethers.toBigInt(7)) //At this stage should be a failed proposal
    expect(await governorV4.proposalProposer(proposalIdV2)).to.equal(proposer.address)
    expect(await governorV4.state(proposalIdV2)).to.equal(ethers.toBigInt(0))

    // Upgrade V4 -> V5
    const governorV5 = (await upgradeProxy("B3TRGovernorV4", "B3TRGovernorV5", governorContractAddress, [], {
      version: 5,
      libraries: {
        GovernorClockLogicV5: await governorClockLogicLibV5.getAddress(),
        GovernorConfiguratorV5: await governorConfiguratorLibV5.getAddress(),
        GovernorDepositLogicV5: await governorDepositLogicLibV5.getAddress(),
        GovernorFunctionRestrictionsLogicV5: await governorFunctionRestrictionsLogicLibV5.getAddress(),
        GovernorProposalLogicV5: await governorProposalLogicLibV5.getAddress(),
        GovernorQuorumLogicV5: await governorQuorumLogicLibV5.getAddress(),
        GovernorStateLogicV5: await governorStateLogicLibV5.getAddress(),
        GovernorVotesLogicV5: await governorVotesLogicLibV5.getAddress(),
      },
    })) as B3TRGovernorV5

    expect(await governorV5.version()).to.equal("5")

    // Verify all proposals persisted through V4 -> V5 upgrade
    expect(await governorV5.proposalProposer(proposalIdV1)).to.equal(proposerV1)
    expect(await governorV5.state(proposalIdV1)).to.equal(ethers.toBigInt(7)) //At this stage should be a failed proposal
    expect(await governorV5.proposalProposer(proposalIdV2)).to.equal(proposer.address)
    expect(await governorV5.state(proposalIdV2)).to.equal(ethers.toBigInt(0))

    // Create another proposal in V5 (still no proposal type concept)
    await waitForBlock(1)
    const roundIdforV5 = await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

    const txV5 = await governorV5.connect(proposer).propose([], [], [], "descriptionV5", roundIdforV5, 0, {
      gasLimit: 10_000_000,
    })
    const proposeReceiptV5 = await txV5.wait()
    const eventV5 = proposeReceiptV5?.logs[0]

    const decodedV5Logs = governorV5.interface.parseLog({
      topics: [...(eventV5?.topics as string[])],
      data: eventV5 ? eventV5.data : "",
    })

    const proposalIdV5 = ethers.toBigInt(decodedV5Logs?.args[0])

    // Verify proposal exists and get initial data
    const proposerV5 = await governorV5.proposalProposer(proposalIdV5)
    const stateV5 = await governorV5.state(proposalIdV5)

    expect(proposerV5).to.equal(proposer.address)
    expect(stateV5).to.equal(ethers.toBigInt(0)) // Pending state

    // Upgrade V5 -> V6
    const governorV6 = (await upgradeProxy("B3TRGovernorV5", "B3TRGovernorV6", governorContractAddress, [], {
      version: 6,
      libraries: {
        GovernorClockLogicV6: await governorClockLogicLibV6.getAddress(),
        GovernorConfiguratorV6: await governorConfiguratorLibV6.getAddress(),
        GovernorDepositLogicV6: await governorDepositLogicLibV6.getAddress(),
        GovernorFunctionRestrictionsLogicV6: await governorFunctionRestrictionsLogicLibV6.getAddress(),
        GovernorProposalLogicV6: await governorProposalLogicLibV6.getAddress(),
        GovernorQuorumLogicV6: await governorQuorumLogicLibV6.getAddress(),
        GovernorStateLogicV6: await governorStateLogicLibV6.getAddress(),
        GovernorVotesLogicV6: await governorVotesLogicLibV6.getAddress(),
      },
    })) as B3TRGovernorV6

    expect(await governorV6.version()).to.equal("6")

    // Upgrade V6 -> V7
    const governorV7 = (await upgradeProxy(
      "B3TRGovernorV6",
      "B3TRGovernorV7",
      governorContractAddress,
      [
        {
          grantDepositThreshold: config.B3TR_GOVERNOR_GRANT_DEPOSIT_THRESHOLD, //Grant deposit threshold
          grantVotingThreshold: config.B3TR_GOVERNOR_GRANT_VOTING_THRESHOLD, //Grant voting threshold
          grantQuorum: config.B3TR_GOVERNOR_GRANT_QUORUM_PERCENTAGE, //Grant quorum percentage
          grantDepositThresholdCap: config.B3TR_GOVERNOR_GRANT_DEPOSIT_THRESHOLD_CAP, //Grant deposit threshold cap
          standardDepositThresholdCap: config.B3TR_GOVERNOR_STANDARD_DEPOSIT_THRESHOLD_CAP, //Standard deposit threshold cap
          standardGMWeight: config.B3TR_GOVERNOR_STANDARD_GM_WEIGHT, //Standard GM weight
          grantGMWeight: config.B3TR_GOVERNOR_GRANT_GM_WEIGHT, //Grant GM weight
          galaxyMember: await galaxyMember.getAddress(),
          grantsManager: await grantsManager.getAddress(),
        },
      ],
      {
        version: 7,
        libraries: {
          GovernorClockLogicV7: await governorClockLogicLibV7.getAddress(),
          GovernorConfiguratorV7: await governorConfiguratorLibV7.getAddress(),
          GovernorDepositLogicV7: await governorDepositLogicLibV7.getAddress(),
          GovernorFunctionRestrictionsLogicV7: await governorFunctionRestrictionsLogicLibV7.getAddress(),
          GovernorProposalLogicV7: await governorProposalLogicLibV7.getAddress(),
          GovernorQuorumLogicV7: await governorQuorumLogicLibV7.getAddress(),
          GovernorStateLogicV7: await governorStateLogicLibV7.getAddress(),
          GovernorVotesLogicV7: await governorVotesLogicLibV7.getAddress(),
        },
      },
    )) as B3TRGovernorV7

    expect(await governorV7.version()).to.equal("7")

    // Upgrade V7 -> V8
    const governorV8 = (await upgradeProxy("B3TRGovernorV7", "B3TRGovernorV8", governorContractAddress, [], {
      version: 8,
      libraries: {
        GovernorClockLogic: await governorClockLogicLib.getAddress(),
        GovernorConfigurator: await governorConfiguratorLib.getAddress(),
        GovernorDepositLogic: await governorDepositLogicLib.getAddress(),
        GovernorFunctionRestrictionsLogic: await governorFunctionRestrictionsLogicLib.getAddress(),
        GovernorProposalLogic: await governorProposalLogicLib.getAddress(),
        GovernorQuorumLogic: await governorQuorumLogicLib.getAddress(),
        GovernorStateLogic: await governorStateLogicLib.getAddress(),
        GovernorVotesLogic: await governorVotesLogicLib.getAddress(),
      },
    })) as B3TRGovernor

    expect(await governorV8.version()).to.equal("8")

    // Verify all proposals persisted through V6 -> V7 upgrade
    expect(await governorV8.proposalProposer(proposalIdV1)).to.equal(proposerV1)
    expect(await governorV8.state(proposalIdV1)).to.equal(ethers.toBigInt(7)) //At this stage should be a failed proposal
    expect(await governorV8.proposalProposer(proposalIdV2)).to.equal(proposer.address)
    expect(await governorV8.state(proposalIdV2)).to.equal(ethers.toBigInt(7)) //At this stage should be a failed proposal
    expect(await governorV8.proposalProposer(proposalIdV5)).to.equal(proposer.address)
    expect(await governorV8.state(proposalIdV5)).to.equal(ethers.toBigInt(0))

    // Test proposal type functionality - old proposals should default to Standard (0)
    expect(await governorV8.proposalType(proposalIdV1)).to.equal(ethers.toBigInt(0)) // Standard type
    expect(await governorV8.proposalType(proposalIdV2)).to.equal(ethers.toBigInt(0)) // Standard type
    expect(await governorV8.proposalType(proposalIdV5)).to.equal(ethers.toBigInt(0)) // Standard type

    // Create new proposals in V7 with explicit proposal types
    await waitForBlock(1)
    const roundIdforV8 = await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

    const txV8 = await governorV8.connect(proposer).propose([], [], [], "descriptionV8", roundIdforV8, 0, {
      gasLimit: 10_000_000,
    })
    const proposeReceiptV8 = await txV8.wait()
    const eventV8 = proposeReceiptV8?.logs[0]

    const decodedV8Logs = governorV8.interface.parseLog({
      topics: [...(eventV8?.topics as string[])],
      data: eventV8 ? eventV8.data : "",
    })

    const proposalIdV8 = ethers.toBigInt(decodedV8Logs?.args[0])

    // Verify proposal exists and get initial data
    const proposerV8 = await governorV8.proposalProposer(proposalIdV8)
    const stateV8 = await governorV8.state(proposalIdV8)

    expect(proposerV8).to.equal(proposer.address)
    expect(stateV8).to.equal(ethers.toBigInt(0)) // Pending state

    // Verify new proposals have correct types
    expect(await governorV8.proposalType(proposalIdV8)).to.equal(ethers.toBigInt(0))

    // Verify all proposal data is still accessible
    expect(await governorV8.proposalProposer(proposalIdV8)).to.equal(proposer.address)
    expect(await governorV8.state(proposalIdV8)).to.equal(ethers.toBigInt(0))

    //TODO: Should be able to move from executed to In development
  })
})
