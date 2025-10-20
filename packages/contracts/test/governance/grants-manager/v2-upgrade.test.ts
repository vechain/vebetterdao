import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { expect } from "chai"
import { ethers } from "hardhat"
import { describe, it } from "mocha"

import { deployAndUpgrade, deployProxy, upgradeProxy } from "../../../scripts/helpers"
import { B3TRGovernor, B3TRGovernorV7, GrantsManager, GrantsManagerV1 } from "../../../typechain-types"
import { DeployInstance, getOrDeployContractInstances } from "../../helpers"
import {
  getProposalIdFromGrantsProposalTx,
  getRoundId,
  startNewAllocationRound,
  waitForCurrentRoundToEnd,
} from "../../helpers/common"
import { setupProposer, setupSupporter, setupVoter } from "../fixture.test"

describe.only("GrantsManager - V2 Upgrade - @shard4g", function () {
  it("Should preserve grant proposal data through V1 -> V2 upgrade with Governor V7 -> V8 upgrade", async () => {
    const config = createLocalConfig()
    const {
      owner,
      b3tr,
      timeLock,
      voterRewards,
      vot3,
      xAllocationVoting,
      veBetterPassport,
      minterAccount,
      otherAccounts,
      emissions,
      treasury,
      galaxyMember,
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
      timelockAdmin,
    } = (await getOrDeployContractInstances({
      forceDeploy: true,
    })) as DeployInstance

    // Setup proposer and voters
    const proposer = otherAccounts[0]
    await setupProposer(proposer, b3tr, vot3, minterAccount)
    await setupVoter(proposer, b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[1], b3tr, vot3, minterAccount, owner, veBetterPassport)
    await setupVoter(otherAccounts[2], b3tr, vot3, minterAccount, owner, veBetterPassport)

    const treasuryAddress = await treasury.getAddress()

    // Deploy GrantsManager V1
    const grantsManagerV1 = (await deployProxy("GrantsManagerV1", [
      owner.address, // temporary governor address
      treasuryAddress,
      owner.address,
      await b3tr.getAddress(),
      config.MINIMUM_MILESTONE_COUNT,
    ])) as GrantsManagerV1

    expect(await grantsManagerV1.version()).to.equal("1")

    // Deploy Governor V1->V7
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
            grantsManager: await grantsManagerV1.getAddress(),
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

    const selectorTransferB3TR = await treasury.interface.getFunction("transferB3TR")?.selector
    await governorV7.setWhitelistFunction(treasuryAddress, selectorTransferB3TR, true)
    expect(await governorV7.version()).to.equal("7")

    // Set governor address in GrantsManager
    await grantsManagerV1.connect(owner).setGovernorContract(await governorV7.getAddress())
    await grantsManagerV1
      .connect(owner)
      .grantRole(await grantsManagerV1.GOVERNANCE_ROLE(), await governorV7.getAddress()) // prev initialized with (TEMP_GOVERNOR_ADDRESS= owner.address)
    await grantsManagerV1.connect(owner).grantRole(await grantsManagerV1.DEFAULT_ADMIN_ROLE(), owner.address)

    // Grant Vote registrar role to Governor
    await voterRewards.connect(owner).grantRole(await voterRewards.VOTE_REGISTRAR_ROLE(), await governorV7.getAddress())

    // Grant roles for proposal execution
    const PROPOSER_ROLE = await timeLock.PROPOSER_ROLE()
    const EXECUTOR_ROLE = await timeLock.EXECUTOR_ROLE()
    const CANCELLER_ROLE = await timeLock.CANCELLER_ROLE()
    await timeLock.connect(timelockAdmin).grantRole(PROPOSER_ROLE, await governorV7.getAddress())
    await timeLock.connect(timelockAdmin).grantRole(EXECUTOR_ROLE, await governorV7.getAddress())
    await timeLock.connect(timelockAdmin).grantRole(CANCELLER_ROLE, await governorV7.getAddress())

    // Create a grant proposal in V7
    const grantee = otherAccounts[3]
    const values = [ethers.parseEther("5000"), ethers.parseEther("5000")]
    const description = "Test grant for upgrade testing"
    const milestonesDetailsMetadataURI = "https://ipfs.io/ipfs/Qm...test"

    const roundId = await getRoundId({
      emissions,
      xAllocationVoting,
    })

    const grantsManagerAddress = await grantsManagerV1.getAddress()

    const calldatas = [
      treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[0]]),
      treasury.interface.encodeFunctionData("transferB3TR", [grantsManagerAddress, values[1]]),
    ]

    // Create grant proposal
    const tx = await governorV7
      .connect(proposer)
      .proposeGrant(
        [treasuryAddress, treasuryAddress],
        [0n, 0n],
        calldatas,
        description,
        roundId,
        0,
        grantee.address,
        milestonesDetailsMetadataURI,
        {
          gasLimit: 10_000_000,
        },
      )
    const proposalId = await getProposalIdFromGrantsProposalTx(tx)

    // Support the proposal
    const depositThreshold = await governorV7.proposalDepositThreshold(proposalId)
    await setupSupporter(owner, vot3, depositThreshold, governorV7 as unknown as B3TRGovernor)
    await governorV7.connect(owner).deposit(depositThreshold, proposalId)

    expect(await governorV7.proposalDepositReached(proposalId)).to.be.true

    // Start a new round to move proposal to active
    await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
    await startNewAllocationRound({
      emissions,
      xAllocationVoting,
      minterAccount,
    })

    // Verify proposal is active
    expect(await governorV7.state(proposalId)).to.equal(ethers.toBigInt(1)) // Active state

    // Cast votes for the proposal
    await governorV7.connect(proposer).castVote(proposalId, 1)
    await governorV7.connect(otherAccounts[1]).castVote(proposalId, 1)
    await governorV7.connect(otherAccounts[2]).castVote(proposalId, 1)

    // Move to next round to finalize voting
    await waitForCurrentRoundToEnd({ emissions, xAllocationVoting })
    await startNewAllocationRound({
      emissions,
      xAllocationVoting,
      minterAccount,
    })

    // Verify proposal succeeded
    expect(await governorV7.state(proposalId)).to.equal(ethers.toBigInt(4)) // Succeeded state

    // Verify grant proposal was created in V1
    const grantProposalV1 = await grantsManagerV1.getGrantProposal(proposalId)
    expect(grantProposalV1.grantsReceiver).to.equal(grantee.address)
    expect(grantProposalV1.metadataURI).to.equal(milestonesDetailsMetadataURI)

    // Verify milestones were created in V1
    const milestonesV1 = await grantsManagerV1.getMilestones(proposalId)
    expect(milestonesV1.length).to.equal(2)
    expect(milestonesV1[0].amount).to.equal(values[0])
    expect(milestonesV1[1].amount).to.equal(values[1])

    // Store V1 data for comparison after upgrade
    const v1MinimumMilestoneCount = await grantsManagerV1.getMinimumMilestoneCount()
    const v1GovernorContract = await grantsManagerV1.getGovernorContract()
    const v1TreasuryContract = await grantsManagerV1.getTreasuryContract()
    const v1B3trContract = await grantsManagerV1.getB3trContract()
    const v1GrantState = await grantsManagerV1.grantState(proposalId)

    await grantsManagerV1.connect(owner).grantRole(await grantsManagerV1.UPGRADER_ROLE(), owner.address)
    // Upgrade GrantsManager V1 -> V2
    const grantsManagerV2 = (await upgradeProxy(
      "GrantsManagerV1",
      "GrantsManager",
      await grantsManagerV1.getAddress(),
      [],
      {
        version: 2,
      },
    )) as GrantsManager

    expect(await grantsManagerV2.version()).to.equal("2")

    // Upgrade Governor V7 -> V8
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

    expect(await governorV8.version()).to.equal("8")

    // Verify all grant proposal data persisted through upgrade
    const grantProposalV2 = await grantsManagerV2.getGrantProposal(proposalId)
    expect(grantProposalV2.grantsReceiver).to.equal(grantProposalV1.grantsReceiver)
    expect(grantProposalV2.metadataURI).to.equal(grantProposalV1.metadataURI)

    // Verify milestones persisted
    const milestonesV2 = await grantsManagerV2.getMilestones(proposalId)
    expect(milestonesV2.length).to.equal(milestonesV1.length)

    for (let i = 0; i < milestonesV1.length; i++) {
      expect(milestonesV2[i].amount).to.equal(milestonesV1[i].amount)
      expect(milestonesV2[i].isApproved).to.equal(milestonesV1[i].isApproved)
      expect(milestonesV2[i].isClaimed).to.equal(milestonesV1[i].isClaimed)
      expect(milestonesV2[i].isRejected).to.equal(milestonesV1[i].isRejected)
    }

    // Verify all contract addresses and settings persisted
    expect(await grantsManagerV2.getMinimumMilestoneCount()).to.equal(v1MinimumMilestoneCount)
    expect(await grantsManagerV2.getGovernorContract()).to.equal(v1GovernorContract)
    expect(await grantsManagerV2.getTreasuryContract()).to.equal(v1TreasuryContract)
    expect(await grantsManagerV2.getB3trContract()).to.equal(v1B3trContract)

    // Verify grant state persisted
    expect(await grantsManagerV2.grantState(proposalId)).to.equal(v1GrantState)

    // Verify proposal persisted in Governor
    expect(await governorV8.proposalProposer(proposalId)).to.equal(proposer.address)
    expect(await governorV8.state(proposalId)).to.equal(ethers.toBigInt(4)) // Succeeded state
  })
})
