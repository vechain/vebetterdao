import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

import { getOrDeployContractInstances } from "../helpers/deploy"
import { bootstrapAndStartEmissions, getVot3Tokens } from "../helpers/common"
import { B3TR, NavigatorRegistry, XAllocationVoting, Emissions, NavigatorVotingUtils } from "../../typechain-types"

describe("NavigatorRegistry Voting - @shard19c", function () {
  let navigatorRegistry: NavigatorRegistry
  let b3tr: B3TR
  let xAllocationVoting: XAllocationVoting
  let emissions: Emissions
  let navigatorVotingUtils: NavigatorVotingUtils
  let owner: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let navigator1: HardhatEthersSigner
  let nonNavigator: HardhatEthersSigner
  let roundId: bigint

  const STAKE_AMOUNT = ethers.parseEther("50000")
  const METADATA_URI = "ipfs://navigator-metadata"

  const app1 = ethers.keccak256(ethers.toUtf8Bytes("App1"))
  const app2 = ethers.keccak256(ethers.toUtf8Bytes("App2"))
  const app3 = ethers.keccak256(ethers.toUtf8Bytes("App3"))

  // Helper: fund account with B3TR (via owner) and approve NavigatorRegistry
  const fundAndApprove = async (account: HardhatEthersSigner, amount: bigint) => {
    await b3tr.connect(owner).transfer(account.address, amount)
    const registryAddress = await navigatorRegistry.getAddress()
    await b3tr.connect(account).approve(registryAddress, amount)
  }

  // Helper: register a navigator with default stake
  const registerNavigator = async (account: HardhatEthersSigner) => {
    await fundAndApprove(account, STAKE_AMOUNT)
    await navigatorRegistry.connect(account).register(STAKE_AMOUNT, METADATA_URI)
  }

  beforeEach(async function () {
    const deployment = await getOrDeployContractInstances({ forceDeploy: true })
    if (!deployment) throw new Error("Failed to deploy contracts")

    navigatorRegistry = deployment.navigatorRegistry
    b3tr = deployment.b3tr
    xAllocationVoting = deployment.xAllocationVoting
    emissions = deployment.emissions
    owner = deployment.owner
    minterAccount = deployment.minterAccount
    otherAccounts = deployment.otherAccounts

    navigator1 = otherAccounts[10]
    nonNavigator = otherAccounts[11]

    // Mint B3TR to owner for navigator registration transfers
    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))

    // Create VOT3 supply (max stake = 1% of VOT3 supply, so need >= 5M VOT3 for 50k stake)
    await getVot3Tokens(otherAccounts[15], "10000000")

    // Deploy NavigatorVotingUtils library for decisionToSupport tests
    const Factory = await ethers.getContractFactory("NavigatorVotingUtils")
    navigatorVotingUtils = (await Factory.deploy()) as unknown as NavigatorVotingUtils
    await navigatorVotingUtils.waitForDeployment()

    // Register navigator
    await registerNavigator(navigator1)

    // Start emissions so we have a round
    await bootstrapAndStartEmissions()
    roundId = await xAllocationVoting.currentRoundId()
  })

  // ======================== 1. setAllocationPreferences ======================== //

  describe("setAllocationPreferences()", function () {
    it("happy path: 2 apps [6000, 4000]", async function () {
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1, app2], [6000, 4000])

      const [appIds, percentages] = await navigatorRegistry.getAllocationPreferences(navigator1.address, roundId)
      expect(appIds).to.deep.equal([app1, app2])
      expect(percentages).to.deep.equal([6000n, 4000n])
    })

    it("1 app with [10000] is valid", async function () {
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1], [10000])

      const [appIds, percentages] = await navigatorRegistry.getAllocationPreferences(navigator1.address, roundId)
      expect(appIds).to.deep.equal([app1])
      expect(percentages).to.deep.equal([10000n])
    })

    it("15 apps is valid", async function () {
      const apps: string[] = []
      const weights: number[] = []
      for (let i = 0; i < 15; i++) {
        apps.push(ethers.keccak256(ethers.toUtf8Bytes(`App${i}`)))
        weights.push(i < 14 ? 666 : 676) // 14 * 666 + 676 = 10000
      }
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, apps, weights)

      const [appIds] = await navigatorRegistry.getAllocationPreferences(navigator1.address, roundId)
      expect(appIds.length).to.equal(15)
    })

    it("16 apps reverts TooManyApps", async function () {
      const apps: string[] = []
      const weights: number[] = []
      for (let i = 0; i < 16; i++) {
        apps.push(ethers.keccak256(ethers.toUtf8Bytes(`App${i}`)))
        weights.push(i < 15 ? 625 : 625) // doesn't matter, should revert first
      }
      await expect(
        navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, apps, weights),
      ).to.be.revertedWithCustomError(navigatorRegistry, "TooManyApps")
    })

    it("empty apps reverts EmptyPreferences", async function () {
      await expect(
        navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [], []),
      ).to.be.revertedWithCustomError(navigatorRegistry, "EmptyPreferences")
    })

    it("duplicate apps reverts DuplicateApp", async function () {
      await expect(
        navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1, app1], [5000, 5000]),
      ).to.be.revertedWithCustomError(navigatorRegistry, "DuplicateApp")
    })

    it("percentages sum != 10000 reverts PercentageMismatch", async function () {
      await expect(
        navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1, app2], [5000, 4000]),
      ).to.be.revertedWithCustomError(navigatorRegistry, "PercentageMismatch")
    })

    it("zero percentage reverts ZeroPercentage", async function () {
      await expect(
        navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1, app2], [0, 10000]),
      ).to.be.revertedWithCustomError(navigatorRegistry, "ZeroPercentage")
    })

    it("already set for this round reverts PreferencesAlreadySet", async function () {
      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1], [10000])

      await expect(
        navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app2], [10000]),
      ).to.be.revertedWithCustomError(navigatorRegistry, "PreferencesAlreadySet")
    })

    it("array length mismatch reverts LengthMismatch", async function () {
      await expect(
        navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1, app2, app3], [5000, 5000]),
      ).to.be.revertedWithCustomError(navigatorVotingUtils, "LengthMismatch")
    })

    it("non-navigator reverts", async function () {
      await expect(
        navigatorRegistry.connect(nonNavigator).setAllocationPreferences(roundId, [app1], [10000]),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NotRegistered")
    })

    it("hasSetPreferences returns true after setting", async function () {
      expect(await navigatorRegistry.hasSetPreferences(navigator1.address, roundId)).to.equal(false)

      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1], [10000])

      expect(await navigatorRegistry.hasSetPreferences(navigator1.address, roundId)).to.equal(true)
    })

    it("getPreferencesSetBlock returns non-zero after setting", async function () {
      expect(await navigatorRegistry.getPreferencesSetBlock(navigator1.address, roundId)).to.equal(0n)

      await navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1], [10000])

      expect(await navigatorRegistry.getPreferencesSetBlock(navigator1.address, roundId)).to.be.gt(0n)
    })

    it("emits AllocationPreferencesSet event", async function () {
      await expect(navigatorRegistry.connect(navigator1).setAllocationPreferences(roundId, [app1, app2], [6000, 4000]))
        .to.emit(navigatorRegistry, "AllocationPreferencesSet")
        .withArgs(navigator1.address, roundId, [app1, app2])
    })
  })

  // ======================== 2. setProposalDecision ======================== //

  describe("setProposalDecision()", function () {
    const proposalId = 1n

    it("decision 1 (Against): getProposalDecision returns 1", async function () {
      await navigatorRegistry.connect(navigator1).setProposalDecision(proposalId, 1)
      expect(await navigatorRegistry.getProposalDecision(navigator1.address, proposalId)).to.equal(1)
    })

    it("decision 2 (For): getProposalDecision returns 2", async function () {
      await navigatorRegistry.connect(navigator1).setProposalDecision(proposalId, 2)
      expect(await navigatorRegistry.getProposalDecision(navigator1.address, proposalId)).to.equal(2)
    })

    it("decision 3 (Abstain): getProposalDecision returns 3", async function () {
      await navigatorRegistry.connect(navigator1).setProposalDecision(proposalId, 3)
      expect(await navigatorRegistry.getProposalDecision(navigator1.address, proposalId)).to.equal(3)
    })

    it("decision 0 reverts InvalidDecision", async function () {
      await expect(
        navigatorRegistry.connect(navigator1).setProposalDecision(proposalId, 0),
      ).to.be.revertedWithCustomError(navigatorRegistry, "InvalidDecision")
    })

    it("decision 4 reverts InvalidDecision", async function () {
      await expect(
        navigatorRegistry.connect(navigator1).setProposalDecision(proposalId, 4),
      ).to.be.revertedWithCustomError(navigatorRegistry, "InvalidDecision")
    })

    it("already set reverts DecisionAlreadySet", async function () {
      await navigatorRegistry.connect(navigator1).setProposalDecision(proposalId, 2)

      await expect(
        navigatorRegistry.connect(navigator1).setProposalDecision(proposalId, 1),
      ).to.be.revertedWithCustomError(navigatorRegistry, "DecisionAlreadySet")
    })

    it("non-navigator reverts", async function () {
      await expect(
        navigatorRegistry.connect(nonNavigator).setProposalDecision(proposalId, 2),
      ).to.be.revertedWithCustomError(navigatorRegistry, "NotRegistered")
    })

    it("hasSetDecision: true after, false before", async function () {
      expect(await navigatorRegistry.hasSetDecision(navigator1.address, proposalId)).to.equal(false)

      await navigatorRegistry.connect(navigator1).setProposalDecision(proposalId, 2)

      expect(await navigatorRegistry.hasSetDecision(navigator1.address, proposalId)).to.equal(true)
    })

    it("emits ProposalDecisionSet event", async function () {
      await expect(navigatorRegistry.connect(navigator1).setProposalDecision(proposalId, 2))
        .to.emit(navigatorRegistry, "ProposalDecisionSet")
        .withArgs(navigator1.address, proposalId, 2)
    })
  })

  // ======================== 3. decisionToSupport ======================== //

  describe("decisionToSupport()", function () {
    it("1 -> 0 (Against)", async function () {
      expect(await navigatorVotingUtils.decisionToSupport(1)).to.equal(0)
    })

    it("2 -> 1 (For)", async function () {
      expect(await navigatorVotingUtils.decisionToSupport(2)).to.equal(1)
    })

    it("3 -> 2 (Abstain)", async function () {
      expect(await navigatorVotingUtils.decisionToSupport(3)).to.equal(2)
    })

    it("0 reverts InvalidDecision", async function () {
      await expect(navigatorVotingUtils.decisionToSupport(0)).to.be.revertedWithCustomError(
        navigatorVotingUtils,
        "InvalidDecision",
      )
    })

    it("4 reverts InvalidDecision", async function () {
      await expect(navigatorVotingUtils.decisionToSupport(4)).to.be.revertedWithCustomError(
        navigatorVotingUtils,
        "InvalidDecision",
      )
    })
  })

  // ======================== 4. getProposalDecision ======================== //

  describe("getProposalDecision()", function () {
    it("reverts DecisionNotSet if not set", async function () {
      const unsetProposalId = 999n
      await expect(
        navigatorRegistry.getProposalDecision(navigator1.address, unsetProposalId),
      ).to.be.revertedWithCustomError(navigatorRegistry, "DecisionNotSet")
    })
  })
})
