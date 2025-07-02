import { ethers } from "hardhat"
import { describe, it } from "mocha"
import { expect } from "chai"
import { getOrDeployContractInstances, getVot3Tokens, startNewAllocationRound, waitForRoundToEnd } from "../helpers"
import { endorseApp } from "../helpers/xnodes"

describe.only("AutoVoting", function () {
  describe("Core logic", function () {
    it("should toggle autovoting status correctly", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { xAllocationVoting, otherAccounts } = config!

      const user = otherAccounts[0]

      expect(await xAllocationVoting.isUserAutovotingEnabled(user.address)).to.be.false

      await xAllocationVoting.connect(user).toggleAutoVoting()
      expect(await xAllocationVoting.isUserAutovotingEnabled(user.address)).to.be.true

      await xAllocationVoting.connect(user).toggleAutoVoting()
      expect(await xAllocationVoting.isUserAutovotingEnabled(user.address)).to.be.false
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
        "XAllocationVotingGovernor: AutoVoting is not enabled",
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
      expect(await xAllocationVoting.isUserAutovotingEnabledAtTimepoint(user.address, currentBlock)).to.be.false

      // Toggle autovoting on
      await xAllocationVoting.connect(user).toggleAutoVoting()
      const toggleBlock = await ethers.provider.getBlockNumber()

      // Should be enabled at current time
      expect(await xAllocationVoting.isUserAutovotingEnabled(user.address)).to.be.true

      // Should be enabled at the toggle block
      expect(await xAllocationVoting.isUserAutovotingEnabledAtTimepoint(user.address, toggleBlock)).to.be.true
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
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Verify preferences are set
      let preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])

      // Disable autovoting
      await xAllocationVoting.connect(user).toggleAutoVoting()

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
  })

  describe("Entire flow", function () {
    it("should enable autovoting for multiple users", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      const { owner, x2EarnApps, xAllocationVoting, veBetterPassport, voterRewards, otherAccounts } = config!

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

      console.log(`User 1 Reward: ${ethers.formatEther(user1Reward)} B3TR`)
      console.log(`User 2 Reward: ${ethers.formatEther(user2Reward)} B3TR`)
      console.log(`User 3 Reward: ${ethers.formatEther(user3Reward)} B3TR`)
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
      console.log("Setting up autovoting for auto users...")
      await xAllocationVoting.connect(autoUser1).toggleAutoVoting()
      await xAllocationVoting.connect(autoUser2).toggleAutoVoting()

      // Set voting preferences for auto users
      await xAllocationVoting.connect(autoUser1).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser2).setUserVotingPreferences([app1Id])
      console.log("Autovoting enabled and preferences set for auto users")

      console.log("\nINITIAL SETUP:")
      console.log(`All users start with: ${startingAmount} VOT3`)

      // ===== ROUND 1 =====
      console.log("=== ROUND 1 ===")
      await startNewAllocationRound()

      // Manual users vote manually
      const voteAmount = ethers.parseEther(startingAmount)
      console.log("Manual users voting manually...")
      await xAllocationVoting.connect(manualUser1).castVote(1, [app1Id], [voteAmount])
      await xAllocationVoting.connect(manualUser2).castVote(1, [app1Id], [voteAmount])

      // Auto users vote via autovoting
      console.log("Auto users voting via autovoting...")
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(autoUser1, 1)
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(autoUser2, 1)

      console.log("All users voted in Round 1 (100 VOT3 each)")

      await waitForRoundToEnd(1)

      // Check rewards before claiming
      const manualUser1R1 = await voterRewards.getReward(1, manualUser1.address)
      const autoUser1R1 = await voterRewards.getReward(1, autoUser1.address)

      console.log(`\nRound 1 Rewards (should be equal):`)
      console.log(`Manual User 1: ${ethers.formatEther(manualUser1R1)} B3TR`)
      console.log(`Auto User 1:   ${ethers.formatEther(autoUser1R1)} B3TR`)

      // All users claim their rewards
      await voterRewards.claimReward(1, manualUser1.address)
      await voterRewards.claimReward(1, manualUser2.address)
      await voterRewards.claimReward(1, autoUser1.address)
      await voterRewards.claimReward(1, autoUser2.address)

      // ===== ROUND 2 =====
      console.log(`\n=== ROUND 2 ===`)
      await startNewAllocationRound()

      // Manual users vote manually
      console.log(`\nManual users voting manually with their VOT3...`)
      await xAllocationVoting.connect(manualUser1).castVote(2, [app1Id], [await vot3.balanceOf(manualUser1.address)])
      await xAllocationVoting.connect(manualUser2).castVote(2, [app1Id], [await vot3.balanceOf(manualUser2.address)])

      // Auto users vote via autovoting (will automatically use all their VOT3)
      console.log(`Auto users voting automatically via autovoting...`)
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(autoUser1, 2)
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(autoUser2, 2)

      console.log(`All users voted in Round 2`)

      await waitForRoundToEnd(2)

      // Check Round 2 rewards
      const manualUser1R2 = await voterRewards.getReward(2, manualUser1.address)
      const autoUser1R2 = await voterRewards.getReward(2, autoUser1.address)

      console.log(`\nRound 2 Rewards (should be equal):`)
      console.log(`Manual User 1: ${ethers.formatEther(manualUser1R2)} B3TR`)
      console.log(`Auto User 1:   ${ethers.formatEther(autoUser1R2)} B3TR`)
    })
  })
})
