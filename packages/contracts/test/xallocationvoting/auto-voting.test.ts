import { ethers } from "hardhat"
import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import {
  getOrDeployContractInstances,
  getVot3Tokens,
  startNewAllocationRound,
  waitForRoundToEnd,
  waitForNextCycle,
} from "../helpers"
import { endorseApp } from "../helpers/xnodes"
import {
  XAllocationVoting,
  X2EarnApps,
  VeBetterPassport,
  VoterRewards,
  B3TR,
  Emissions,
  VOT3,
  RelayerRewardsPool,
  X2EarnCreator,
} from "../../typechain-types"

describe("AutoVoting - @shard14a", function () {
  let xAllocationVoting: XAllocationVoting
  let x2EarnApps: X2EarnApps
  let veBetterPassport: VeBetterPassport
  let voterRewards: VoterRewards
  let b3tr: B3TR
  let emissions: Emissions
  let relayerRewardsPool: RelayerRewardsPool
  let vot3: VOT3
  let owner: HardhatEthersSigner
  let relayer1: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let user: HardhatEthersSigner
  let user1: HardhatEthersSigner
  let user2: HardhatEthersSigner
  let appOwner: HardhatEthersSigner
  let appOwner1: HardhatEthersSigner
  let appOwner2: HardhatEthersSigner
  let appOwner3: HardhatEthersSigner
  let x2EarnCreatorContract: X2EarnCreator

  // Main setup - used by most tests
  const setupContracts = async () => {
    const config = await getOrDeployContractInstances({
      forceDeploy: true,
    })
    if (!config) throw new Error("Failed to deploy contracts")

    xAllocationVoting = config.xAllocationVoting
    x2EarnApps = config.x2EarnApps
    veBetterPassport = config.veBetterPassport
    voterRewards = config.voterRewards
    b3tr = config.b3tr
    emissions = config.emissions
    vot3 = config.vot3
    owner = config.owner
    minterAccount = config.minterAccount
    otherAccounts = config.otherAccounts
    relayerRewardsPool = config.relayerRewardsPool
    relayer1 = otherAccounts[10]
    user = otherAccounts[0]
    user1 = otherAccounts[1]
    user2 = otherAccounts[2]
    appOwner = otherAccounts[11]
    appOwner1 = otherAccounts[12]
    appOwner2 = otherAccounts[13]
    appOwner3 = otherAccounts[14]
    x2EarnCreatorContract = config.x2EarnCreator

    await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

    await emissions.connect(minterAccount).bootstrap()
    await voterRewards.connect(owner).setRelayerFeePercentage(10)

    await veBetterPassport.toggleCheck(1)
    await veBetterPassport.whitelist(user.address)
    await veBetterPassport.whitelist(user1.address)
    await veBetterPassport.whitelist(user2.address)
    await getVot3Tokens(user, "100")
    await getVot3Tokens(user1, "100")
    await getVot3Tokens(user2, "100")
    await x2EarnCreatorContract.connect(owner).safeMint(appOwner1.address)
    await x2EarnCreatorContract.connect(owner).safeMint(appOwner2.address)
    await x2EarnCreatorContract.connect(owner).safeMint(appOwner3.address)
  }

  describe.only("Core logic", function () {
    beforeEach(async function () {
      await setupContracts()
      await emissions.connect(minterAccount).start()
    })

    it("should toggle autovoting status correctly", async function () {
      // =========== Initial cycle ===========
      const initialCycle = await emissions.getCurrentCycle()
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(user.address))
      await x2EarnApps.connect(owner).submitApp(user.address, user.address, user.address, "metadataURI")
      await endorseApp(app1Id, user)
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Toggle auto-voting: ON, OFF, and ON
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).toggleAutoVoting()
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false

      // Wait for the next cycle to be distributable
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // =========== cycle 1 ===========
      const cycle1 = await emissions.getCurrentCycle()

      expect(Number(cycle1)).to.be.greaterThan(Number(initialCycle))
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id]) // The user must set his preferences again to be able to vote after autovoting is disabled
      expect(await xAllocationVoting.getUserVotingPreferences(user.address)).to.deep.equal([app1Id])
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true
    })

    it("should set and get user voting preferences", async function () {
      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Enable autovoting first
      await xAllocationVoting.connect(user).toggleAutoVoting()

      // Set voting preferences
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Get and verify preferences
      const preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])
    })

    it("should fail to cast vote on behalf of user if autovoting is not enabled", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      const preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])

      await startNewAllocationRound()

      // cast vote on behalf of user
      await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)).to.be.revertedWith(
        "XAllocationVotingGovernor: auto voting is not enabled",
      )
    })

    it("should clear preferences when autovoting is disabled", async function () {
      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Enable autovoting and set preferences
      await expect(xAllocationVoting.connect(user).toggleAutoVoting())
        .to.emit(xAllocationVoting, "AutoVotingToggled")
        .withArgs(user.address, true)
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Verify preferences are set
      let preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])

      // Disable autovoting
      const txn = await xAllocationVoting.connect(user).toggleAutoVoting()
      await expect(txn).to.emit(xAllocationVoting, "AutoVotingToggled").withArgs(user.address, false)

      // Preferences should be cleared
      preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([])
    })

    it("should validate app preferences", async function () {
      // Enable autovoting
      await xAllocationVoting.connect(user).toggleAutoVoting()

      // Should revert with empty apps array
      await expect(xAllocationVoting.connect(user).setUserVotingPreferences([])).to.be.revertedWith(
        "AutoVotingLogic: no apps to vote for",
      )

      // Should revert with invalid app
      const invalidAppId = ethers.keccak256(ethers.toUtf8Bytes("invalid"))
      await expect(xAllocationVoting.connect(user).setUserVotingPreferences([invalidAppId])).to.be.revertedWith(
        "AutoVotingLogic: invalid app",
      )
    })

    it("should count total auto-voting users", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(user.address))
      await x2EarnApps.connect(owner).submitApp(user.address, user.address, user.address, "metadataURI")
      await endorseApp(app1Id, user)

      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user1).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user2).setUserVotingPreferences([app1Id])

      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user1).toggleAutoVoting()
      await xAllocationVoting.connect(user2).toggleAutoVoting()

      // Still disabled until the next cycle
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user1.address)).to.be.false
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user2.address)).to.be.false
      expect(await xAllocationVoting.getTotalAutoVotingUsers()).to.equal(0)

      // Wait for the next cycle to be distributable
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user1.address)).to.be.true
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user2.address)).to.be.true
      expect(await xAllocationVoting.getTotalAutoVotingUsers()).to.equal(3)

      await xAllocationVoting.connect(user2).toggleAutoVoting()
      // remaining 3 until the next cycle
      expect(await xAllocationVoting.getTotalAutoVotingUsers()).to.equal(3)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      expect(await xAllocationVoting.isUserAutoVotingEnabled(user2.address)).to.be.false
      expect(await xAllocationVoting.getTotalAutoVotingUsers()).to.equal(2)
    })

    it("should toggle off autovoting when transfer below 1 VOT3 when autovoting is enabled", async function () {
      const recipient = otherAccounts[3]

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      expect(await vot3.balanceOf(user.address)).to.equal(ethers.parseEther("100"))

      // Enable autovoting and set preferences
      await xAllocationVoting.connect(user).toggleAutoVoting()
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true
      expect(await vot3.version()).to.equal("2")

      // Transfer 99.5 VOT3 which would leave user with 0.5 VOT3 (below 1 VOT3)
      // This should automatically toggle off autovoting and allow the transfer
      await vot3.connect(user).transfer(recipient.address, ethers.parseEther("99.5"))
      expect(await vot3.balanceOf(recipient.address)).to.equal(ethers.parseEther("99.5"))

      // // Still enabled in current cycle
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true

      // Wait for next cycle for autovoting to be disabled
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // Verify autovoting is now disabled
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false

      // Verify final balances
      expect(await vot3.balanceOf(user.address)).to.equal(ethers.parseEther("0.5"))
    })

    it("revert if app preferences are set to empty array when autovoting is enabled", async function () {
      // @todo autovoting
      // Scenario:
      // Auto voting status
      // Initial cycle - OFF
      // Cycle 1 - ON (enabled during previous cycle)
      // - During Cycle 1, user sets app preferences to empty array
      // - Toggle autovoting off
      // Cycle 2 - OFF
      // - App preferences are cleared
      // - Users can set app preferences to empty array (This is an edge case)
    })

    it("should correctly handle auto-voting status when disabled mid-cycle", async function () {
      // Scenario:
      // Auto voting status
      // Initial cycle - OFF
      // Cycle 1 - ON (enabled during previous cycle)
      // Cycle 2 - OFF (disabled during cycle 1)
      // Cycle 3 - OFF (remains disabled)

      // =========== initial cycle ===========
      // Get initial cycle data
      const initialCycle = await emissions.getCurrentCycle()
      const initialEmissionBlock = await emissions.lastEmissionBlock()

      // Enable auto-voting mid-cycle
      await xAllocationVoting.connect(user).toggleAutoVoting()
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false

      // Wait for the next cycle to be distributable
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // =========== cycle 1 ===========
      const cycle1 = await emissions.getCurrentCycle()
      const cycle1EmissionBlock = await emissions.lastEmissionBlock()

      expect(Number(cycle1)).to.be.greaterThan(Number(initialCycle))
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true

      // User disables auto-voting mid-cycle
      await xAllocationVoting.connect(user).toggleAutoVoting()

      // Wait for the next cycle
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // =========== cycle 2 ===========
      const cycle2 = await emissions.getCurrentCycle()
      const cycle2EmissionBlock = await emissions.lastEmissionBlock()

      expect(Number(cycle2)).to.be.greaterThan(Number(cycle1))
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // =========== cycle 3 ===========
      const cycle3 = await emissions.getCurrentCycle()
      const cycle3EmissionBlock = await emissions.lastEmissionBlock()

      // Verify cycle has advanced
      expect(Number(cycle3)).to.be.greaterThan(Number(cycle2))
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false

      // It should be disabled at the start of the initial cycle
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, initialEmissionBlock)).to.be.false
      // It should be enabled at the start of cycle 1
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, cycle1EmissionBlock)).to.be.true
      // But it should still be disabled at the start of cycle 2
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, cycle2EmissionBlock)).to.be.false
      // Auto-voting should be disabled at the start of cycle 3
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, cycle3EmissionBlock)).to.be.false
    })
  })

  describe("castVoteOnBehalfOf function", function () {
    beforeEach(async function () {
      await setupContracts()

      // Give user voting power another 200
      const startingAmount = "200"
      await getVot3Tokens(user, startingAmount) // Now the user has 300 VOT3

      await emissions.connect(minterAccount).start()
      await relayerRewardsPool.connect(owner).registerRelayer(relayer1.address)
    })

    it("should successfully cast vote on behalf of user with single app", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId)).to.not.be.reverted

      // Verify vote was cast
      const hasVoted = await xAllocationVoting.hasVoted(roundId, user.address)
      expect(hasVoted).to.be.true
    })

    it("should successfully cast vote on behalf of user with multiple apps and distribute votes equally", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner1.address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner2.address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner3.address))

      await x2EarnApps
        .connect(appOwner1)
        .submitApp(appOwner1.address, appOwner1.address, appOwner1.address, "metadataURI")
      await x2EarnApps
        .connect(appOwner2)
        .submitApp(appOwner2.address, appOwner2.address, appOwner2.address, "metadataURI")
      await x2EarnApps
        .connect(appOwner3)
        .submitApp(appOwner3.address, appOwner3.address, appOwner3.address, "metadataURI")

      await endorseApp(app1Id, appOwner1)
      await endorseApp(app2Id, appOwner2)
      await endorseApp(app3Id, appOwner3)

      // Enable autovoting and set preferences for all apps
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id, app2Id, app3Id])

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId)).to.not.be.reverted

      // Verify vote was cast
      const hasVoted = await xAllocationVoting.hasVoted(roundId, user.address)
      expect(hasVoted).to.be.true

      // Verify votes were distributed equally (100 VOT3 each)
      const expectedVotePerApp = ethers.parseEther("100")
      const app1Votes = await xAllocationVoting.getAppVotes(roundId, app1Id)
      const app2Votes = await xAllocationVoting.getAppVotes(roundId, app2Id)
      const app3Votes = await xAllocationVoting.getAppVotes(roundId, app3Id)

      expect(app1Votes).to.equal(expectedVotePerApp)
      expect(app2Votes).to.equal(expectedVotePerApp)
      expect(app3Votes).to.equal(expectedVotePerApp)
    })

    it("should revert with no early access vote allocation for relayers when round is not active", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId)).to.be.revertedWith(
        "RelayerRewardsPool: relayer has no early access vote allocation",
      )
    })

    it("should revert when voter is not a person", async function () {
      const user = otherAccounts[5]

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Enable autovoting and set preferences
      await expect(xAllocationVoting.connect(user).toggleAutoVoting()).to.be.revertedWithCustomError(
        xAllocationVoting,
        "GovernorPersonhoodVerificationFailed",
      )
    })

    it("should revert when user has no votes available", async function () {
      const user = otherAccounts[0]
      const appOwner = otherAccounts[1]

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Don't give user any voting power - this should cause failure
      // Setup passport
      await veBetterPassport.whitelist(user.address)

      // Enable autovoting and set preferences
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Start round
      await emissions.connect(minterAccount).start()

      // Try to cast vote on behalf of user
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, 1)).to.be.revertedWith(
        "XAllocationVotingGovernor: no votes available",
      )
    })

    it("should revert when user has no voting preferences set", async function () {
      const user = otherAccounts[0]
      const appOwner = otherAccounts[1]

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Give user voting power
      const startingAmount = "100"
      await getVot3Tokens(user, startingAmount)

      // Setup passport
      await veBetterPassport.whitelist(user.address)

      // Enable autovoting but don't set preferences
      await xAllocationVoting.connect(user).toggleAutoVoting()

      // Start round
      await startNewAllocationRound()

      // Try to cast vote on behalf of user
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, 1)).to.be.revertedWith(
        "XAllocationVotingGovernor: no eligible apps to vote for",
      )
    })

    it("should revert when the users have no eligible apps to vote for", async function () {
      const user = otherAccounts[0]
      const appOwner = otherAccounts[1]

      // Create app and endorse it
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(appOwner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Setup user
      await getVot3Tokens(user, "100")
      await veBetterPassport.whitelist(user.address)

      // Enable autovoting with this app
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Start round 1 - app is eligible
      await startNewAllocationRound()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, 1)).to.be.true

      // App gets unendorsed during round 1, but autovoting should still work
      await x2EarnApps.connect(appOwner).unendorseApp(app1Id, 1)

      // Autovoting should still work since app is still eligible for current round
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, 1)).to.not.be.reverted

      // Fast forward through grace period...
      await waitForRoundToEnd(1)

      // Round 2 - still eligible (grace period)
      await startNewAllocationRound()
      await x2EarnApps.checkEndorsement(app1Id)
      expect(await xAllocationVoting.isEligibleForVote(app1Id, 2)).to.be.true

      // Round 3 - still eligible (grace period)
      await waitForRoundToEnd(2)
      await startNewAllocationRound()
      await x2EarnApps.checkEndorsement(app1Id)
      expect(await xAllocationVoting.isEligibleForVote(app1Id, 3)).to.be.true

      // Round 4 - NOW app becomes ineligible
      await waitForRoundToEnd(3)
      await startNewAllocationRound()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, 4)).to.be.false

      // Autovoting should fail because no eligible apps
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, 4)).to.be.revertedWith(
        "XAllocationVotingGovernor: no eligible apps to vote for",
      )
    })

    it("should filter out apps that become unendorsed during autovoting", async function () {
      const user = otherAccounts[0]
      const appOwner = otherAccounts[1]
      const appOwner2 = otherAccounts[2]

      // Create app and endorse it
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(appOwner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner2.address))
      await x2EarnApps
        .connect(appOwner2)
        .submitApp(appOwner2.address, appOwner2.address, appOwner2.address, "metadataURI")
      await endorseApp(app2Id, appOwner2)

      // Setup user
      await getVot3Tokens(user, "100")
      await veBetterPassport.whitelist(user.address)

      // Enable autovoting with this app
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id, app2Id])

      // Start round 1 - app is eligible
      await startNewAllocationRound()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, 1)).to.be.true

      // App gets unendorsed during round 1, but autovoting should still work
      await x2EarnApps.connect(appOwner).unendorseApp(app1Id, 1)

      // Autovoting should still work since app is still eligible for current round
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, 1)).to.not.be.reverted

      // Fast forward through grace period...
      await waitForRoundToEnd(1)

      // Round 2 - still eligible (grace period)
      await startNewAllocationRound()
      await x2EarnApps.checkEndorsement(app1Id)
      expect(await xAllocationVoting.isEligibleForVote(app1Id, 2)).to.be.true

      // Round 3 - still eligible (grace period)
      await waitForRoundToEnd(2)
      await startNewAllocationRound()
      await x2EarnApps.checkEndorsement(app1Id)
      expect(await xAllocationVoting.isEligibleForVote(app1Id, 3)).to.be.true

      // Round 4 - NOW app1 becomes ineligible but app2 is still eligible
      await waitForRoundToEnd(3)
      await startNewAllocationRound()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, 4)).to.be.false
      expect(await xAllocationVoting.isEligibleForVote(app2Id, 4)).to.be.true

      // Autovoting should succeed because app2 is still eligible
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, 4)).to.not.be.reverted
    })

    it("should handle vote distribution with remaining dust correctly", async function () {
      const user = otherAccounts[0]
      const appOwner1 = otherAccounts[1]
      const appOwner2 = otherAccounts[2]
      const appOwner3 = otherAccounts[3]

      // Create test apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner1.address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner2.address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner3.address))

      await x2EarnApps
        .connect(appOwner1)
        .submitApp(appOwner1.address, appOwner1.address, appOwner1.address, "metadataURI")
      await x2EarnApps
        .connect(appOwner2)
        .submitApp(appOwner2.address, appOwner2.address, appOwner2.address, "metadataURI")
      await x2EarnApps
        .connect(appOwner3)
        .submitApp(appOwner3.address, appOwner3.address, appOwner3.address, "metadataURI")

      await endorseApp(app1Id, appOwner1)
      await endorseApp(app2Id, appOwner2)
      await endorseApp(app3Id, appOwner3)

      // Give user voting power that doesn't divide evenly by 3 (100 / 3 = 33.33...)
      const startingAmount = "100"
      await getVot3Tokens(user, startingAmount)

      // Setup passport
      await veBetterPassport.whitelist(user.address)

      // Enable autovoting and set preferences for all apps
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id, app2Id, app3Id])

      // Start round
      await startNewAllocationRound()

      // Cast vote on behalf of user
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, 1)).to.not.be.reverted

      // Verify vote was cast
      const hasVoted = await xAllocationVoting.hasVoted(1, user.address)
      expect(hasVoted).to.be.true

      // // Verify votes were distributed (33 VOT3 each, 1 VOT3 dust remains)
      const app1Votes = await xAllocationVoting.getAppVotes(1, app1Id)
      const app2Votes = await xAllocationVoting.getAppVotes(1, app2Id)
      const app3Votes = await xAllocationVoting.getAppVotes(1, app3Id)

      // All apps should get the same amount
      expect(app1Votes).to.equal(app2Votes)
      expect(app2Votes).to.equal(app3Votes)

      // Total distributed should be less than original (proving dust exists)
      const totalVotes = app1Votes + app2Votes + app3Votes
      const originalAmount = ethers.parseEther("100")
      expect(totalVotes).to.be.lessThan(originalAmount)

      // Each app should get roughly 33.33 ETH (but as integer division)
      const totalDistributed = app1Votes + app2Votes + app3Votes
      const dust = originalAmount - totalDistributed // 1 VOT3 dust
      expect(dust).to.equal(1)
    })
  })

  describe("Events", function () {
    beforeEach(async function () {
      await setupContracts()

      await veBetterPassport.toggleCheck(1)
      await relayerRewardsPool.connect(owner).registerRelayer(relayer1.address)
    })

    it("should emit all autovoting events for single user complete flow", async function () {
      const user = otherAccounts[1]
      const appOwner = otherAccounts[0]

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      const startingAmount = "100"
      await getVot3Tokens(user, startingAmount)

      await veBetterPassport.whitelist(user.address)

      // Initially autovoting should be disabled
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false
      expect(await xAllocationVoting.getUserVotingPreferences(user.address)).to.deep.equal([])

      // 1. Should emit AutoVotingToggled(user, true)
      await expect(xAllocationVoting.connect(user).toggleAutoVoting())
        .to.emit(xAllocationVoting, "AutoVotingToggled")
        .withArgs(user.address, true)

      // 2. Set voting preferences - should emit PreferredAppsUpdated
      await expect(xAllocationVoting.connect(user).setUserVotingPreferences([app1Id]))
        .to.emit(xAllocationVoting, "PreferredAppsUpdated")
        .withArgs(user.address, [app1Id])

      // Verify preferences set
      const preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])

      // Start a new round
      await startNewAllocationRound()

      // Vote via autovoting
      // Emit AllocationVoteCast and AllocationAutoVoteCast events
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user, 1))
        .to.emit(xAllocationVoting, "AllocationVoteCast")
        .withArgs(user.address, 1, [app1Id], [ethers.parseEther("100")])
        .to.emit(xAllocationVoting, "AllocationAutoVoteCast")
        .withArgs(user.address, 1, [app1Id], [ethers.parseEther("100")])

      await waitForRoundToEnd(1)

      // Check rewards
      const userReward = await voterRewards.getReward(1, user.address)
      expect(userReward).to.not.equal(0)

      // Verify state changes
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true

      const finalPreferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(finalPreferences).to.deep.equal([app1Id])

      // Test timepoint-based queries
      const currentBlock = await ethers.provider.getBlockNumber()
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, currentBlock)).to.be.true
    })
  })

  describe("Entire flow", function () {
    // Fresh setup for this specific test suite
    beforeEach(async function () {
      // Get completely fresh contracts for this test suite
      await setupContracts()

      // Setup passport checks for voting
      await veBetterPassport.toggleCheck(1)
      await relayerRewardsPool.connect(owner).registerRelayer(relayer1.address)
    })

    it("should enable autovoting for multiple users", async function () {
      // Setup app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await x2EarnApps
        .connect(owner)
        .submitApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      await endorseApp(app1Id, otherAccounts[0])

      // Setup users
      const user1 = otherAccounts[2]
      const user2 = otherAccounts[3]
      const user3 = otherAccounts[4]

      // Give all users equal starting VOT3
      const startingAmount = "100"
      await getVot3Tokens(user1, startingAmount)
      await getVot3Tokens(user2, startingAmount)
      await getVot3Tokens(user3, startingAmount)

      expect(await b3tr.balanceOf(user1.address)).to.equal(0)
      expect(await b3tr.balanceOf(user2.address)).to.equal(0)
      expect(await b3tr.balanceOf(user3.address)).to.equal(0)

      // Whitelist all users
      await veBetterPassport.whitelist(user1.address)
      await veBetterPassport.whitelist(user2.address)
      await veBetterPassport.whitelist(user3.address)

      // Enable autovoting for auto users
      await xAllocationVoting.connect(user1).toggleAutoVoting()
      await xAllocationVoting.connect(user2).toggleAutoVoting()
      await xAllocationVoting.connect(user3).toggleAutoVoting()

      // Set voting preferences for auto users
      await xAllocationVoting.connect(user1).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user2).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user3).setUserVotingPreferences([app1Id])

      // Start a new round
      await startNewAllocationRound()

      // Vote via autovoting
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user1, 1)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user2, 1)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user3, 1)

      await waitForRoundToEnd(1)

      // Check rewards
      const user1Reward = await voterRewards.getReward(1, user1.address)
      const user2Reward = await voterRewards.getReward(1, user2.address)
      const user3Reward = await voterRewards.getReward(1, user3.address)

      expect(user1Reward).to.not.equal(0)
      expect(user2Reward).to.not.equal(0)
      expect(user3Reward).to.not.equal(0)

      await voterRewards.claimReward(1, user1.address)
      await voterRewards.claimReward(1, user2.address)
      await voterRewards.claimReward(1, user3.address)

      expect(await b3tr.balanceOf(user1.address)).to.not.equal(0)
      expect(await b3tr.balanceOf(user2.address)).to.not.equal(0)
      expect(await b3tr.balanceOf(user3.address)).to.not.equal(0)
    })

    it("should work with manual and auto users", async function () {
      // Setup app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await x2EarnApps
        .connect(owner)
        .submitApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      await endorseApp(app1Id, otherAccounts[0])

      // Setup users
      const manualUser1 = otherAccounts[1]
      const manualUser2 = otherAccounts[2]
      const autoUser1 = otherAccounts[3]
      const autoUser2 = otherAccounts[4]

      // Give all users equal starting VOT3
      const startingAmount = "1000"
      await getVot3Tokens(manualUser1, startingAmount)
      await getVot3Tokens(manualUser2, startingAmount)
      await getVot3Tokens(autoUser1, startingAmount)
      await getVot3Tokens(autoUser2, startingAmount)

      // Whitelist all users
      await veBetterPassport.whitelist(manualUser1.address)
      await veBetterPassport.whitelist(manualUser2.address)
      await veBetterPassport.whitelist(autoUser1.address)
      await veBetterPassport.whitelist(autoUser2.address)

      // Enable autovoting for auto users
      await xAllocationVoting.connect(autoUser1).toggleAutoVoting()
      await xAllocationVoting.connect(autoUser2).toggleAutoVoting()

      // Set voting preferences for auto users
      await xAllocationVoting.connect(autoUser1).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser2).setUserVotingPreferences([app1Id])

      // ===== ROUND 1 =====
      await startNewAllocationRound()

      // Manual users vote manually
      const voteAmount = ethers.parseEther(startingAmount)
      await xAllocationVoting.connect(manualUser1).castVote(1, [app1Id], [voteAmount])
      await xAllocationVoting.connect(manualUser2).castVote(1, [app1Id], [voteAmount])

      // Auto users vote via autovoting
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser1, 1)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser2, 1)

      await waitForRoundToEnd(1)

      // Check rewards before claiming
      const manualUser1R1 = await voterRewards.getReward(1, manualUser1.address)
      const autoUser1R1 = await voterRewards.getReward(1, autoUser1.address)

      expect(manualUser1R1).to.not.equal(0)
      expect(autoUser1R1).to.not.equal(0)

      // All users claim their rewards
      await voterRewards.claimReward(1, manualUser1.address)
      await voterRewards.claimReward(1, manualUser2.address)
      await voterRewards.claimReward(1, autoUser1.address)
      await voterRewards.claimReward(1, autoUser2.address)

      // ===== ROUND 2 =====
      await startNewAllocationRound()

      // Manual users vote manually
      await xAllocationVoting.connect(manualUser1).castVote(2, [app1Id], [await vot3.balanceOf(manualUser1.address)])
      await xAllocationVoting.connect(manualUser2).castVote(2, [app1Id], [await vot3.balanceOf(manualUser2.address)])

      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser1, 2)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser2, 2)

      await waitForRoundToEnd(2)

      // Check Round 2 rewards
      const manualUser1R2 = await voterRewards.getReward(2, manualUser1.address)
      const autoUser1R2 = await voterRewards.getReward(2, autoUser1.address)

      expect(manualUser1R2).to.not.equal(0)
      expect(autoUser1R2).to.not.equal(0)
    })
  })
})
