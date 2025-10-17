import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { deployProxyOnly, initializeProxy, upgradeProxy } from "../../scripts/helpers"
import { B3TRGovernor, B3TRGovernorV1 } from "../../typechain-types"
import { DeployInstance, getOrDeployContractInstances } from "../helpers"
import { getVot3Tokens, moveBlocks, startNewAllocationRound, waitForCurrentRoundToEnd } from "../helpers/common"
import { setupProposer, setupVoter, STANDARD_PROPOSAL_TYPE, startNewRoundAndGetRoundId } from "./fixture.test"

describe.only("Governance - V8 Upgrade - @shard4g", function () {
  it("Should preserve non-executable V1 proposal through all upgrades and successfully approve it in V8", async () => {
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

    // Setup proposer and voters for this test
    const proposer = otherAccounts[0]
    await setupProposer(proposer, b3tr, vot3, minterAccount)
    await setupVoter(proposer, b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[1], b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[2], b3tr, vot3, minterAccount, owner, veBetterPassport)

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
          quorumPercentage: config.B3TR_GOVERNOR_QUORUM_PERCENTAGE,
          initialDepositThreshold: config.B3TR_GOVERNOR_DEPOSIT_THRESHOLD,
          initialMinVotingDelay: config.B3TR_GOVERNOR_MIN_VOTING_DELAY,
          initialVotingThreshold: config.B3TR_GOVERNOR_VOTING_THRESHOLD,
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

    // Grant Vote registrar role to Governor
    await voterRewards.connect(owner).grantRole(await voterRewards.VOTE_REGISTRAR_ROLE(), governorContractAddress)

    // Create proposal in V1
    const roundId = await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

    const txV1 = await governorV1.connect(proposer).propose([], [], [], "Test proposal from V1", roundId, 0, {
      gasLimit: 10_000_000,
    })
    const proposeReceiptV1 = await txV1.wait()
    const eventV1 = proposeReceiptV1?.logs[0]

    const decodedV1Logs = governorV1.interface.parseLog({
      topics: [...(eventV1?.topics as string[])],
      data: eventV1 ? eventV1.data : "",
    })

    const proposalId = ethers.toBigInt(decodedV1Logs?.args[0])

    // Verify proposal exists in V1
    expect(await governorV1.proposalProposer(proposalId)).to.equal(proposer.address)
    expect(await governorV1.state(proposalId)).to.equal(ethers.toBigInt(0)) // Pending state

    // Upgrade V1 -> V2
    await upgradeProxy("B3TRGovernorV1", "B3TRGovernorV2", governorContractAddress, [], {
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
    })

    // Upgrade V2 -> V3
    await upgradeProxy("B3TRGovernorV2", "B3TRGovernorV3", governorContractAddress, [], {
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
    })

    // Upgrade V3 -> V4
    await upgradeProxy(
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
    )

    // Upgrade V4 -> V5
    await upgradeProxy("B3TRGovernorV4", "B3TRGovernorV5", governorContractAddress, [], {
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
    })

    // Upgrade V5 -> V6
    await upgradeProxy("B3TRGovernorV5", "B3TRGovernorV6", governorContractAddress, [], {
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
    })

    // Upgrade V6 -> V7
    await upgradeProxy(
      "B3TRGovernorV6",
      "B3TRGovernorV7",
      governorContractAddress,
      [
        {
          grantDepositThreshold: config.B3TR_GOVERNOR_GRANT_DEPOSIT_THRESHOLD,
          grantVotingThreshold: config.B3TR_GOVERNOR_GRANT_VOTING_THRESHOLD,
          grantQuorum: config.B3TR_GOVERNOR_GRANT_QUORUM_PERCENTAGE,
          grantDepositThresholdCap: config.B3TR_GOVERNOR_GRANT_DEPOSIT_THRESHOLD_CAP,
          standardDepositThresholdCap: config.B3TR_GOVERNOR_STANDARD_DEPOSIT_THRESHOLD_CAP,
          standardGMWeight: config.B3TR_GOVERNOR_STANDARD_GM_WEIGHT,
          grantGMWeight: config.B3TR_GOVERNOR_GRANT_GM_WEIGHT,
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
    )

    // Upgrade V7 -> V8 (latest version)
    const governorV8 = (await upgradeProxy("B3TRGovernorV7", "B3TRGovernor", governorContractAddress, [], {
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

    // Verify proposal persisted through all upgrades
    expect(await governorV8.proposalProposer(proposalId)).to.equal(proposer.address)

    // Verify proposal type defaults to Standard (0) for old proposal
    expect(await governorV8.proposalType(proposalId)).to.equal(ethers.toBigInt(0))

    // Get deposit threshold and support the proposal
    const depositThreshold = await governorV8.depositThresholdByProposalType(STANDARD_PROPOSAL_TYPE)
    await getVot3Tokens(proposer, ethers.formatEther(depositThreshold))
    await vot3.connect(proposer).approve(await governorV8.getAddress(), depositThreshold)
    await governorV8.connect(proposer).deposit(depositThreshold, proposalId)

    // Verify deposit reached
    expect(await governorV8.proposalDepositReached(proposalId)).to.be.true

    // Wait for voting delay
    await moveBlocks(10)

    // Start a new round to move proposal to active
    await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
    await startNewAllocationRound({
      emissions,
      xAllocationVoting,
      minterAccount,
    })

    // Verify proposal is active
    expect(await governorV8.state(proposalId)).to.equal(ethers.toBigInt(1)) // Active state

    // Cast votes for the proposal
    await governorV8.connect(proposer).castVote(proposalId, 1)
    await governorV8.connect(otherAccounts[1]).castVote(proposalId, 1)
    await governorV8.connect(otherAccounts[2]).castVote(proposalId, 1)

    // Move to next round to finalize voting
    await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
    await startNewAllocationRound({
      emissions,
      xAllocationVoting,
      minterAccount,
    })

    // Verify proposal succeeded
    expect(await governorV8.state(proposalId)).to.equal(ethers.toBigInt(4)) // Succeeded state
  })
})
