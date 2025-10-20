import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { deployAndUpgrade, upgradeProxy } from "../../scripts/helpers"
import { B3TRGovernor, B3TRGovernorV7 } from "../../typechain-types"
import { DeployInstance, getOrDeployContractInstances } from "../helpers"
import {
  getProposalIdFromTx,
  getVot3Tokens,
  startNewAllocationRound,
  waitForCurrentRoundToEnd,
} from "../helpers/common"
import { setupVoter, STANDARD_PROPOSAL_TYPE, startNewRoundAndGetRoundId } from "./fixture.test"

describe("Governance - V8 Compatibility - @shard4h", function () {
  it("Proposals approved in V7 should be approved in V8", async () => {
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
      minterAccount,
      otherAccounts,
      B3trContract,
      veBetterPassport,
      grantsManager,
      galaxyMember,
      emissions,
    } = (await getOrDeployContractInstances({
      forceDeploy: true,
    })) as DeployInstance

    const governorV7 = (await deployAndUpgrade(
      [
        "B3TRGovernorV1",
        "B3TRGovernorV2",
        "B3TRGovernorV3",
        "B3TRGovernorV4",
        "B3TRGovernorV5",
        "B3TRGovernorV6",
        "B3TRGovernorV7",
      ],
      [
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
        [],
        [],
        [await veBetterPassport.getAddress()],
        [],
        [],
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
      ],
      {
        versions: [undefined, 2, 3, 4, 5, 6, 7],
        libraries: [
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
          {
            GovernorClockLogicV3: await governorClockLogicLibV3.getAddress(),
            GovernorConfiguratorV3: await governorConfiguratorLibV3.getAddress(),
            GovernorDepositLogicV3: await governorDepositLogicLibV3.getAddress(),
            GovernorFunctionRestrictionsLogicV3: await governorFunctionRestrictionsLogicLibV3.getAddress(),
            GovernorProposalLogicV3: await governorProposalLogicLibV3.getAddress(),
            GovernorQuorumLogicV3: await governorQuorumLogicLibV3.getAddress(),
            GovernorStateLogicV3: await governorStateLogicLibV3.getAddress(),
            GovernorVotesLogicV3: await governorVotesLogicLibV3.getAddress(),
          },
          {
            GovernorClockLogicV4: await governorClockLogicLibV4.getAddress(),
            GovernorConfiguratorV4: await governorConfiguratorLibV4.getAddress(),
            GovernorDepositLogicV4: await governorDepositLogicLibV4.getAddress(),
            GovernorFunctionRestrictionsLogicV4: await governorFunctionRestrictionsLogicLibV4.getAddress(),
            GovernorProposalLogicV4: await governorProposalLogicLibV4.getAddress(),
            GovernorQuorumLogicV4: await governorQuorumLogicLibV4.getAddress(),
            GovernorStateLogicV4: await governorStateLogicLibV4.getAddress(),
            GovernorVotesLogicV4: await governorVotesLogicLibV4.getAddress(),
          },
          {
            GovernorClockLogicV5: await governorClockLogicLibV5.getAddress(),
            GovernorConfiguratorV5: await governorConfiguratorLibV5.getAddress(),
            GovernorDepositLogicV5: await governorDepositLogicLibV5.getAddress(),
            GovernorFunctionRestrictionsLogicV5: await governorFunctionRestrictionsLogicLibV5.getAddress(),
            GovernorProposalLogicV5: await governorProposalLogicLibV5.getAddress(),
            GovernorQuorumLogicV5: await governorQuorumLogicLibV5.getAddress(),
            GovernorStateLogicV5: await governorStateLogicLibV5.getAddress(),
            GovernorVotesLogicV5: await governorVotesLogicLibV5.getAddress(),
          },
          {
            GovernorClockLogicV6: await governorClockLogicLibV6.getAddress(),
            GovernorConfiguratorV6: await governorConfiguratorLibV6.getAddress(),
            GovernorDepositLogicV6: await governorDepositLogicLibV6.getAddress(),
            GovernorFunctionRestrictionsLogicV6: await governorFunctionRestrictionsLogicLibV6.getAddress(),
            GovernorProposalLogicV6: await governorProposalLogicLibV6.getAddress(),
            GovernorQuorumLogicV6: await governorQuorumLogicLibV6.getAddress(),
            GovernorStateLogicV6: await governorStateLogicLibV6.getAddress(),
            GovernorVotesLogicV6: await governorVotesLogicLibV6.getAddress(),
          },
          {
            GovernorClockLogicV7: await governorClockLogicLibV7.getAddress(),
            GovernorConfiguratorV7: await governorConfiguratorLibV7.getAddress(),
            GovernorDepositLogicV7: await governorDepositLogicLibV7.getAddress(),
            GovernorFunctionRestrictionsLogicV7: await governorFunctionRestrictionsLogicLibV7.getAddress(),
            GovernorProposalLogicV7: await governorProposalLogicLibV7.getAddress(),
            GovernorQuorumLogicV7: await governorQuorumLogicLibV7.getAddress(),
            GovernorStateLogicV7: await governorStateLogicLibV7.getAddress(),
            GovernorVotesLogicV7: await governorVotesLogicLibV7.getAddress(),
          },
        ],
      },
    )) as B3TRGovernorV7

    await voterRewards.connect(owner).grantRole(await voterRewards.VOTE_REGISTRAR_ROLE(), await governorV7.getAddress())

    //Create proposal
    const roundId = await startNewRoundAndGetRoundId(emissions, xAllocationVoting)

    const tx = await governorV7.connect(owner).propose([], [], [], "Test proposal", roundId, 0, {
      gasLimit: 10_000_000,
    })
    await tx.wait()
    const proposalId = await getProposalIdFromTx(tx)

    //Support Proposal
    const depositThreshold = await governorV7.depositThresholdByProposalType(STANDARD_PROPOSAL_TYPE)
    //Get more than the deposit threshold to support the proposal
    await getVot3Tokens(owner, ethers.formatEther(depositThreshold * 2n))
    await vot3.connect(owner).approve(await governorV7.getAddress(), depositThreshold * 2n)
    await governorV7.connect(owner).deposit(depositThreshold * 2n, proposalId)

    //Verify proposal is supported
    expect(await governorV7.proposalDepositReached(proposalId)).to.be.true

    //Setup user as voter
    await setupVoter(owner, b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[0], b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[1], b3tr, vot3, minterAccount, owner, veBetterPassport)

    //Start new round
    await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
    await startNewAllocationRound({
      emissions,
      xAllocationVoting,
      minterAccount,
    })

    //Vote for proposal
    await governorV7.connect(owner).castVote(proposalId, 1)
    await governorV7.connect(otherAccounts[0]).castVote(proposalId, 1)
    await governorV7.connect(otherAccounts[1]).castVote(proposalId, 1)

    //Move to next round
    await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
    await startNewAllocationRound({
      emissions,
      xAllocationVoting,
      minterAccount,
    })

    //Verify proposal succeeded in V7
    const stateInV7 = await governorV7.state(proposalId)
    expect(stateInV7).to.equal(ethers.toBigInt(4)) // Succeeded state

    // Now upgrade to governor v8
    const governorV8 = (await upgradeProxy("B3TRGovernorV7", "B3TRGovernor", await governorV7.getAddress(), [], {
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
    const stateInV8 = await governorV8.state(proposalId)

    expect(stateInV8).to.equal(stateInV7)
  })
})
