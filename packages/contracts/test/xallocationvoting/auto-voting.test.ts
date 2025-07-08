import { ethers } from "hardhat"
import { describe, it } from "mocha"
import { expect } from "chai"
import { getOrDeployContractInstances, getVot3Tokens, startNewAllocationRound, waitForRoundToEnd } from "../helpers"
import { endorseApp } from "../helpers/xnodes"

describe("AutoVoting - @shard14a", function () {
  describe("Core logic", function () {
    it("should toggle autovoting status correctly", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { xAllocationVoting, otherAccounts } = config!

      const user = otherAccounts[0]

      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false

      await xAllocationVoting.connect(user).toggleAutoVoting()
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true

      await xAllocationVoting.connect(user).toggleAutoVoting()
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false
    })

    it("should set and get user voting preferences", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { owner, x2EarnApps, xAllocationVoting, otherAccounts } = config!

      const user = otherAccounts[0]
      const appOwner = otherAccounts[1]

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
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { owner, x2EarnApps, xAllocationVoting, otherAccounts } = config!

      const user = otherAccounts[0]
      const appOwner = otherAccounts[1]

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

    it("should check autovoting status at specific timepoints", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { xAllocationVoting, otherAccounts } = config!

      const user = otherAccounts[0]

      // Get current block number
      const currentBlock = await ethers.provider.getBlockNumber()

      // Initially autovoting should be disabled at current time
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, currentBlock)).to.be.false

      // Toggle autovoting on
      await xAllocationVoting.connect(user).toggleAutoVoting()
      const toggleBlock = await ethers.provider.getBlockNumber()

      // Should be enabled at current time
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true

      // Should be enabled at the toggle block
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, toggleBlock)).to.be.true
    })

    it("should clear preferences when autovoting is disabled", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { owner, x2EarnApps, xAllocationVoting, otherAccounts } = config!

      const user = otherAccounts[0]
      const appOwner = otherAccounts[1]

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
      await expect(xAllocationVoting.connect(user).toggleAutoVoting())
        .to.emit(xAllocationVoting, "AutoVotingToggled")
        .withArgs(user.address, false)

      // Preferences should be cleared
      preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([])
    })

    it("should validate app preferences", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { xAllocationVoting, otherAccounts } = config!

      const user = otherAccounts[0]

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

    describe("castVoteOnBehalfOf function", function () {
      it("should successfully cast vote on behalf of user with single app", async function () {
        const config = await getOrDeployContractInstances({
          forceDeploy: true,
        })
        const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, otherAccounts } = config!

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
        await veBetterPassport.toggleCheck(1)

        // Enable autovoting and set preferences
        await xAllocationVoting.connect(user).toggleAutoVoting()
        await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

        // Start round
        await startNewAllocationRound()

        // Cast vote on behalf of user
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)).to.not.be.reverted

        // Verify vote was cast
        const hasVoted = await xAllocationVoting.hasVoted(1, user.address)
        expect(hasVoted).to.be.true
      })

      it("should successfully cast vote on behalf of user with multiple apps and distribute votes equally", async function () {
        const config = await getOrDeployContractInstances({
          forceDeploy: true,
        })
        const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, otherAccounts } = config!

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

        // Give user voting power - use amount divisible by 3 for even distribution
        const startingAmount = "300"
        await getVot3Tokens(user, startingAmount)

        // Setup passport
        await veBetterPassport.whitelist(user.address)
        await veBetterPassport.toggleCheck(1)

        // Enable autovoting and set preferences for all apps
        await xAllocationVoting.connect(user).toggleAutoVoting()
        await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id, app2Id, app3Id])

        // Start round
        await startNewAllocationRound()

        // Cast vote on behalf of user
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)).to.not.be.reverted

        // Verify vote was cast
        const hasVoted = await xAllocationVoting.hasVoted(1, user.address)
        expect(hasVoted).to.be.true

        // Verify votes were distributed equally (100 VOT3 each)
        const expectedVotePerApp = ethers.parseEther("100")
        const app1Votes = await xAllocationVoting.getAppVotes(1, app1Id)
        const app2Votes = await xAllocationVoting.getAppVotes(1, app2Id)
        const app3Votes = await xAllocationVoting.getAppVotes(1, app3Id)

        expect(app1Votes).to.equal(expectedVotePerApp)
        expect(app2Votes).to.equal(expectedVotePerApp)
        expect(app3Votes).to.equal(expectedVotePerApp)
      })

      it("should revert when round is not active", async function () {
        const config = await getOrDeployContractInstances({
          forceDeploy: true,
        })
        const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, otherAccounts } = config!

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
        await veBetterPassport.toggleCheck(1)

        // Enable autovoting and set preferences
        await xAllocationVoting.connect(user).toggleAutoVoting()
        await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

        // Try to vote without starting a round
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1))
          .to.be.revertedWithCustomError(xAllocationVoting, "GovernorNonexistentRound")
          .withArgs(1)
      })

      it("should revert when voter is not a person", async function () {
        const config = await getOrDeployContractInstances({
          forceDeploy: true,
        })
        const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, otherAccounts } = config!

        const user = otherAccounts[0]
        const appOwner = otherAccounts[1]

        // Create a test app
        const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
        await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
        await endorseApp(app1Id, appOwner)

        // Give user voting power
        const startingAmount = "100"
        await getVot3Tokens(user, startingAmount)

        // Don't whitelist user - this should cause passport check to fail
        await veBetterPassport.toggleCheck(1)

        // Enable autovoting and set preferences
        await xAllocationVoting.connect(user).toggleAutoVoting()
        await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

        // Start round
        await startNewAllocationRound()

        // Try to cast vote on behalf of user
        await expect(
          xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1),
        ).to.be.revertedWithCustomError(xAllocationVoting, "GovernorPersonhoodVerificationFailed")
      })

      it("should revert when user has no votes available", async function () {
        const config = await getOrDeployContractInstances({
          forceDeploy: true,
        })
        const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, otherAccounts } = config!

        const user = otherAccounts[0]
        const appOwner = otherAccounts[1]

        // Create a test app
        const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
        await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
        await endorseApp(app1Id, appOwner)

        // Don't give user any voting power - this should cause failure
        // Setup passport
        await veBetterPassport.whitelist(user.address)
        await veBetterPassport.toggleCheck(1)

        // Enable autovoting and set preferences
        await xAllocationVoting.connect(user).toggleAutoVoting()
        await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

        // Start round
        await startNewAllocationRound()

        // Try to cast vote on behalf of user
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)).to.be.revertedWith(
          "XAllocationVotingGovernor: no votes available",
        )
      })

      it("should revert when user has no voting preferences set", async function () {
        const config = await getOrDeployContractInstances({
          forceDeploy: true,
        })
        const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, otherAccounts } = config!

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
        await veBetterPassport.toggleCheck(1)

        // Enable autovoting but don't set preferences
        await xAllocationVoting.connect(user).toggleAutoVoting()

        // Start round
        await startNewAllocationRound()

        // Try to cast vote on behalf of user
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)).to.be.revertedWith(
          "XAllocationVotingGovernor: no eligible apps to vote for",
        )
      })

      it("should revert when the users have no eligible apps to vote for", async function () {
        const config = await getOrDeployContractInstances({
          forceDeploy: true,
        })
        const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, otherAccounts } = config!

        const user = otherAccounts[0]
        const appOwner = otherAccounts[1]

        // Create app and endorse it
        const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
        await x2EarnApps
          .connect(appOwner)
          .submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
        await endorseApp(app1Id, appOwner)

        // Setup user
        await getVot3Tokens(user, "100")
        await veBetterPassport.whitelist(user.address)
        await veBetterPassport.toggleCheck(1)

        // Enable autovoting with this app
        await xAllocationVoting.connect(user).toggleAutoVoting()
        await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

        // Start round 1 - app is eligible
        await startNewAllocationRound()
        expect(await xAllocationVoting.isEligibleForVote(app1Id, 1)).to.be.true

        // App gets unendorsed during round 1, but autovoting should still work
        await x2EarnApps.connect(appOwner).unendorseApp(app1Id, 1)

        // Autovoting should still work since app is still eligible for current round
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)).to.not.be.reverted

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
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 4)).to.be.revertedWith(
          "XAllocationVotingGovernor: no eligible apps to vote for",
        )
      })

      it("should filter out apps that become unendorsed during autovoting", async function () {
        const config = await getOrDeployContractInstances({
          forceDeploy: true,
        })
        const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, otherAccounts } = config!

        const user = otherAccounts[0]
        const appOwner = otherAccounts[1]
        const appOwner2 = otherAccounts[2]

        // Create app and endorse it
        const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
        await x2EarnApps
          .connect(appOwner)
          .submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
        await endorseApp(app1Id, appOwner)

        const app2Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner2.address))
        await x2EarnApps
          .connect(appOwner2)
          .submitApp(appOwner2.address, appOwner2.address, appOwner2.address, "metadataURI")
        await endorseApp(app2Id, appOwner2)

        // Setup user
        await getVot3Tokens(user, "100")
        await veBetterPassport.whitelist(user.address)
        await veBetterPassport.toggleCheck(1)

        // Enable autovoting with this app
        await xAllocationVoting.connect(user).toggleAutoVoting()
        await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id, app2Id])

        // Start round 1 - app is eligible
        await startNewAllocationRound()
        expect(await xAllocationVoting.isEligibleForVote(app1Id, 1)).to.be.true

        // App gets unendorsed during round 1, but autovoting should still work
        await x2EarnApps.connect(appOwner).unendorseApp(app1Id, 1)

        // Autovoting should still work since app is still eligible for current round
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)).to.not.be.reverted

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

        // Autovoting should fail because no eligible apps
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 4)).to.not.be.reverted
      })

      it("should handle vote distribution with remaining dust correctly", async function () {
        const config = await getOrDeployContractInstances({
          forceDeploy: true,
        })
        const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, otherAccounts } = config!

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
        await veBetterPassport.toggleCheck(1)

        // Enable autovoting and set preferences for all apps
        await xAllocationVoting.connect(user).toggleAutoVoting()
        await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id, app2Id, app3Id])

        // Start round
        await startNewAllocationRound()

        // Cast vote on behalf of user
        await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)).to.not.be.reverted

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
  })

  describe("Events", function () {
    it("should emit all autovoting events for single user complete flow", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, voterRewards, otherAccounts } = config!

      const user = otherAccounts[1]
      const appOwner = otherAccounts[0]

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      const startingAmount = "100"
      await getVot3Tokens(user, startingAmount)

      await veBetterPassport.whitelist(user.address)
      await veBetterPassport.toggleCheck(1)

      // Initially autovoting should be disabled
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false
      expect(await xAllocationVoting.getUserVotingPreferences(user.address)).to.deep.equal([])

      // 1. Enable autovoting - should emit AutoVotingToggled(user, true)
      await expect(xAllocationVoting.connect(user).toggleAutoVoting())
        .to.emit(xAllocationVoting, "AutoVotingToggled")
        .withArgs(user.address, true)

      // Verify state change
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true

      // 2. Set voting preferences - should emit PreferredAppsUpdated
      await expect(xAllocationVoting.connect(user).setUserVotingPreferences([app1Id]))
        .to.emit(xAllocationVoting, "PreferredAppsUpdated")
        .withArgs(user.address, [app1Id])

      // Verify preferences set
      const preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])

      // Start a new round for autovoting test
      await startNewAllocationRound()

      // Vote via autovoting
      await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user, 1))
        .to.emit(xAllocationVoting, "AllocationAutoVoteCast")
        .withArgs(user.address, 1, [app1Id], [ethers.parseEther("100")])

      await waitForRoundToEnd(1)

      // Check rewards
      const userReward = await voterRewards.getReward(1, user.address)
      expect(userReward).to.not.equal(0)

      // 3. Disable autovoting - should emit AutoVotingToggled(user, false) and clear preferences
      await expect(xAllocationVoting.connect(user).toggleAutoVoting())
        .to.emit(xAllocationVoting, "AutoVotingToggled")
        .withArgs(user.address, false)

      // Verify state changes
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false
      const clearedPreferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(clearedPreferences).to.deep.equal([])

      // 4. Re-enable autovoting - should emit AutoVotingToggled(user, true)
      await expect(xAllocationVoting.connect(user).toggleAutoVoting())
        .to.emit(xAllocationVoting, "AutoVotingToggled")
        .withArgs(user.address, true)

      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.true

      // 5. Set preferences again - should emit PreferredAppsUpdated
      await expect(xAllocationVoting.connect(user).setUserVotingPreferences([app1Id]))
        .to.emit(xAllocationVoting, "PreferredAppsUpdated")
        .withArgs(user.address, [app1Id])

      const finalPreferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(finalPreferences).to.deep.equal([app1Id])

      // Test timepoint-based queries
      const currentBlock = await ethers.provider.getBlockNumber()
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, currentBlock)).to.be.true
    })
  })

  describe("Entire flow", function () {
    it("should enable autovoting for multiple users", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, voterRewards, b3tr, otherAccounts } = config!

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
      await veBetterPassport.toggleCheck(1)

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
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(user1, 1)
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(user2, 1)
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(user3, 1)

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
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { vot3, owner, x2EarnApps, xAllocationVoting, veBetterPassport, voterRewards, otherAccounts } = config!

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
      await veBetterPassport.toggleCheck(1)

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
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(autoUser1, 1)
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(autoUser2, 1)

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

      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(autoUser1, 2)
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(autoUser2, 2)

      await waitForRoundToEnd(2)

      // Check Round 2 rewards
      const manualUser1R2 = await voterRewards.getReward(2, manualUser1.address)
      const autoUser1R2 = await voterRewards.getReward(2, autoUser1.address)

      expect(manualUser1R2).to.not.equal(0)
      expect(autoUser1R2).to.not.equal(0)
    })
  })
})
