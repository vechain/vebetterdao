import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it } from "mocha"

import { getOrDeployContractInstances, getVot3Tokens, startNewAllocationRound, waitForRoundToEnd } from "../helpers"
import { endorseApp } from "../helpers/xnodes"

describe("VoterRewards V6 - @shard10a", function () {
  describe("Relayer Fee Functionality", function () {
    it("should take a fee when a relayer claims for a user with auto-voting enabled", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      if (!config) throw new Error("Failed to deploy contracts")

      const {
        voterRewards,
        xAllocationVoting,
        b3tr,
        x2EarnApps,
        veBetterPassport,
        relayerRewardsPool,
        owner,
        otherAccounts,
      } = config

      // Setup roles
      const relayer = otherAccounts[0]
      const user = otherAccounts[1]
      const appOwner = otherAccounts[4]

      // Setup
      await relayerRewardsPool.connect(owner).registerRelayer(relayer.address)
      await voterRewards.connect(owner).setRelayerFeePercentage(10)
      await voterRewards.connect(owner).setXAllocationVoting(await xAllocationVoting.getAddress())

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Setup user
      const startingAmount = "1000"
      await getVot3Tokens(user, startingAmount)

      // Whitelist user
      await veBetterPassport.whitelist(user.address)
      await veBetterPassport.toggleCheck(1)

      // Enable auto-voting for user
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Start a new allocation round
      await startNewAllocationRound()

      // Auto-vote for user via owner
      const txVote = await xAllocationVoting.connect(relayer).castVoteOnBehalfOf(user.address, 1)
      const voteWeight = await relayerRewardsPool.getVoteWeight()
      await expect(txVote)
        .to.emit(relayerRewardsPool, "RelayerActionRegistered")
        .withArgs(relayer.address, 1, 1, voteWeight)

      // Wait for the round to end
      await waitForRoundToEnd(1)

      // Check initial balances
      const initialRelayerBalance = await b3tr.balanceOf(relayer.address)
      const initialUserBalance = await b3tr.balanceOf(user.address)
      const initialPoolTotal = await relayerRewardsPool.getTotalRewards(1)
      const claimWeight = await relayerRewardsPool.getClaimWeight()

      // Get the expected rewards
      const userReward = await voterRewards.getReward(1, user.address)
      const userGMReward = await voterRewards.getGMReward(1, user.address)
      const userTotalReward = userReward + userGMReward

      // Calculate expected fee (10% of total reward)
      const expectedFee = await voterRewards.getFee(1, user.address)

      // Relayer claims for user (who has auto-voting enabled)
      const tx = await voterRewards.connect(relayer).claimReward(1, user.address)

      // Relayer action registered in pool and fee deposited
      await expect(tx)
        .to.emit(relayerRewardsPool, "RelayerActionRegistered")
        .withArgs(relayer.address, 1, 2, claimWeight)
      await expect(tx)
        .to.emit(relayerRewardsPool, "RewardsDeposited")
        .withArgs(1, expectedFee, initialPoolTotal + expectedFee)

      // Check balances after claim
      const relayerBalanceAfter = await b3tr.balanceOf(relayer.address)
      const userBalanceAfter = await b3tr.balanceOf(user.address)

      // Relayer should NOT receive the fee directly
      expect(relayerBalanceAfter - initialRelayerBalance).to.equal(0n)

      // User should have received the reward minus the fee
      expect(userBalanceAfter - initialUserBalance).to.equal(userTotalReward)
    })

    it("should not take a fee when a relayer claims for a user without auto-voting enabled", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      if (!config) throw new Error("Failed to deploy contracts")

      const {
        voterRewards,
        xAllocationVoting,
        b3tr,
        x2EarnApps,
        veBetterPassport,
        relayerRewardsPool,
        owner,
        otherAccounts,
      } = config

      // Setup roles
      const relayer = otherAccounts[0]
      const user = otherAccounts[1]
      const appOwner = otherAccounts[4]

      // Set XAllocationVoting address in VoterRewards
      await voterRewards.connect(owner).setXAllocationVoting(await xAllocationVoting.getAddress())

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Setup user with enough tokens to meet the voting threshold
      const startingAmount = "100" // Increased from 100 to ensure enough voting power
      await getVot3Tokens(user, startingAmount)

      // Whitelist user
      await veBetterPassport.whitelist(user.address)
      await veBetterPassport.toggleCheck(1)

      // Start a new allocation round
      await startNewAllocationRound()

      // User votes manually with enough tokens to meet the threshold
      const votingThreshold = await xAllocationVoting.votingThreshold()
      const voteAmount = votingThreshold
      await xAllocationVoting.connect(user).castVote(1, [app1Id], [voteAmount])

      // Wait for the round to end
      await waitForRoundToEnd(1)

      // Check initial balances
      const initialRelayerBalance = await b3tr.balanceOf(relayer.address)
      const initialUserBalance = await b3tr.balanceOf(user.address)

      // Get the expected rewards
      const userReward = await voterRewards.getReward(1, user.address)
      const userGMReward = await voterRewards.getGMReward(1, user.address)
      const userTotalReward = userReward + userGMReward

      // Relayer claims for user (who doesn't have auto-voting enabled)
      const tx = await voterRewards.connect(relayer).claimReward(1, user.address)

      // Should emit RewardClaimedV2 event
      await expect(tx).to.emit(voterRewards, "RewardClaimedV2").withArgs(1, user.address, userReward, userGMReward)

      // Should NOT emit RelayerActionRegistered and RewardsDeposited events
      await expect(tx).to.not.emit(relayerRewardsPool, "RelayerActionRegistered")
      await expect(tx).to.not.emit(relayerRewardsPool, "RewardsDeposited")

      // Check balances after claim
      const relayerBalanceAfter = await b3tr.balanceOf(relayer.address)
      const userBalanceAfter = await b3tr.balanceOf(user.address)

      // Relayer balance should not change
      expect(relayerBalanceAfter).to.equal(initialRelayerBalance)

      // User should have received the full reward
      expect(userBalanceAfter - initialUserBalance).to.equal(userTotalReward)
    })

    it("should not take a fee when user claims their own rewards", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      if (!config) throw new Error("Failed to deploy contracts")

      const {
        voterRewards,
        xAllocationVoting,
        b3tr,
        x2EarnApps,
        veBetterPassport,
        owner,
        otherAccounts,
        relayerRewardsPool,
      } = config

      // Setup roles
      const user = otherAccounts[1]
      const appOwner = otherAccounts[4]
      const relayer = otherAccounts[5]

      // Setup
      await relayerRewardsPool.connect(owner).registerRelayer(relayer.address)
      await voterRewards.connect(owner).setRelayerFeePercentage(10)
      await voterRewards.connect(owner).setXAllocationVoting(await xAllocationVoting.getAddress())

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Setup user
      const startingAmount = "1000"
      await getVot3Tokens(user, startingAmount)

      // Whitelist user
      await veBetterPassport.whitelist(user.address)
      await veBetterPassport.toggleCheck(1)

      // Enable auto-voting for user
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Start a new allocation round
      await startNewAllocationRound()

      // Auto-vote for user
      await xAllocationVoting.connect(relayer).castVoteOnBehalfOf(user.address, 1)

      // Wait for the round to end
      await waitForRoundToEnd(1)

      // Get the expected rewards
      const userReward = await voterRewards.getReward(1, user.address)
      const userGMReward = await voterRewards.getGMReward(1, user.address)
      const userTotalReward = userReward + userGMReward

      // Initial balance
      const initialUserBalance = await b3tr.balanceOf(user.address)

      // User claims their own rewards
      const tx = await voterRewards.connect(user).claimReward(1, user.address)

      // Should not emit RelayerFeeTaken event
      await expect(tx).to.not.emit(voterRewards, "RelayerFeeTaken")

      // Check balance after claim
      const userBalanceAfter = await b3tr.balanceOf(user.address)

      // User should have received the full reward
      expect(userBalanceAfter - initialUserBalance).to.equal(userTotalReward)
    })

    it("should handle fee for auto-voting and non-auto-voting users", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      if (!config) throw new Error("Failed to deploy contracts")

      const {
        voterRewards,
        xAllocationVoting,
        b3tr,
        x2EarnApps,
        veBetterPassport,
        relayerRewardsPool,
        owner,
        otherAccounts,
      } = config

      // Setup roles
      const relayer = otherAccounts[0]
      const user = otherAccounts[1]
      const user2 = otherAccounts[2]
      const appOwner = otherAccounts[4]

      // Setup
      await relayerRewardsPool.connect(owner).registerRelayer(relayer.address)
      await voterRewards.connect(owner).setRelayerFeePercentage(10)
      await voterRewards.connect(owner).setXAllocationVoting(await xAllocationVoting.getAddress())

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Setup user
      const startingAmount = "1000"
      await getVot3Tokens(user, startingAmount)
      await getVot3Tokens(user2, startingAmount)

      // Whitelist user
      await veBetterPassport.whitelist(user.address)
      await veBetterPassport.whitelist(user2.address)
      await veBetterPassport.toggleCheck(1)

      // Enable auto-voting for user
      await xAllocationVoting.connect(user).toggleAutoVoting()
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Start a new allocation round
      await startNewAllocationRound()

      // Auto-vote for user
      const txVote = await xAllocationVoting.connect(relayer).castVoteOnBehalfOf(user.address, 1)
      const voteWeight = await relayerRewardsPool.getVoteWeight()
      await expect(txVote)
        .to.emit(relayerRewardsPool, "RelayerActionRegistered")
        .withArgs(relayer.address, 1, 1, voteWeight)

      // Cast vote for user2 manually
      await xAllocationVoting.connect(user2).castVote(1, [app1Id], [ethers.parseEther("1000")])

      // Wait for the round to end
      await waitForRoundToEnd(1)

      // Get the expected rewards
      const userReward = await voterRewards.getReward(1, user.address)
      const userGMReward = await voterRewards.getGMReward(1, user.address)
      const userTotalReward = userReward + userGMReward

      const user2Reward = await voterRewards.getReward(1, user2.address)
      const user2GMReward = await voterRewards.getGMReward(1, user2.address)
      const user2TotalReward = user2Reward + user2GMReward

      // 10% fee for auto-voting user
      const expectedFee = await voterRewards.getFee(1, user.address)

      // No fee for user2 because auto-voting is disabled
      const expectedUser2Fee = await voterRewards.getFee(1, user2.address)

      // Initial balances
      const initialRelayerBalance = await b3tr.balanceOf(relayer.address)
      const initialUserBalance = await b3tr.balanceOf(user.address)
      const initialPoolTotal = await relayerRewardsPool.getTotalRewards(1)
      const claimWeight = await relayerRewardsPool.getClaimWeight()

      // // Relayer claims for user
      const tx = await voterRewards.connect(relayer).claimReward(1, user.address)

      // // Action should be registered in the pool and fee deposited
      await expect(tx)
        .to.emit(relayerRewardsPool, "RelayerActionRegistered")
        .withArgs(relayer.address, 1, 2, claimWeight)
      await expect(tx)
        .to.emit(relayerRewardsPool, "RewardsDeposited")
        .withArgs(1, expectedFee, initialPoolTotal + expectedFee)

      // // Check balances after claim
      const relayerBalanceAfter = await b3tr.balanceOf(relayer.address)
      const userBalanceAfter = await b3tr.balanceOf(user.address)

      // // Relayer should NOT receive the fee directly
      expect(relayerBalanceAfter - initialRelayerBalance).to.equal(0n)
      expect(userBalanceAfter - initialUserBalance).to.equal(userTotalReward)

      // Fee should be deposited to the pool
      const poolTotalAfter = await relayerRewardsPool.getTotalRewards(1)
      expect(poolTotalAfter - initialPoolTotal).to.equal(expectedFee)

      // User2 should have received the full reward
      await voterRewards.connect(user2).claimReward(1, user2.address)
      const user2BalanceAfter = await b3tr.balanceOf(user2.address)
      expect(user2BalanceAfter).to.equal(user2TotalReward)
      expect(expectedUser2Fee).to.equal(0n)
    })

    it("should handle fee for relayer claiming their own rewards", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      if (!config) throw new Error("Failed to deploy contracts")

      const {
        voterRewards,
        xAllocationVoting,
        b3tr,
        x2EarnApps,
        veBetterPassport,
        relayerRewardsPool,
        owner,
        otherAccounts,
      } = config

      // Setup multiple relayers and users
      const relayer1 = otherAccounts[0]
      const relayer2 = otherAccounts[1]
      const user1 = otherAccounts[2]
      const user2 = otherAccounts[3]
      const appOwner = otherAccounts[4]

      // Register both relayers to get early access to auto-voting actions
      await relayerRewardsPool.connect(owner).registerRelayer(relayer1.address)
      await relayerRewardsPool.connect(owner).registerRelayer(relayer2.address)

      await voterRewards.connect(owner).setRelayerFeePercentage(10)

      // Set XAllocationVoting address in VoterRewards
      await voterRewards.connect(owner).setXAllocationVoting(await xAllocationVoting.getAddress())

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Setup users
      const startingAmount = "1000"
      await getVot3Tokens(user1, startingAmount)
      await getVot3Tokens(user2, startingAmount)

      // Whitelist users
      await veBetterPassport.whitelist(user1.address)
      await veBetterPassport.whitelist(user2.address)
      await veBetterPassport.toggleCheck(1)

      // Enable auto-voting for both users
      await xAllocationVoting.connect(user1).toggleAutoVoting()
      await xAllocationVoting.connect(user1).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user2).toggleAutoVoting()
      await xAllocationVoting.connect(user2).setUserVotingPreferences([app1Id])

      // Start a new allocation round
      await startNewAllocationRound()

      // Relayer1 auto-votes for user1 (earns VOTE action)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user1.address, 1)

      // Relayer2 auto-votes for user2 (earns VOTE action)
      await xAllocationVoting.connect(relayer2).castVoteOnBehalfOf(user2.address, 1)

      // Wait for the round to end
      await waitForRoundToEnd(1)

      // Get initial pool state
      const initialPoolTotal = await relayerRewardsPool.getTotalRewards(1)
      const claimWeight = await relayerRewardsPool.getClaimWeight()

      // Relayer1 claims for user1 (earns CLAIM action)
      const user1Fee = await voterRewards.getFee(1, user1.address)
      const tx1 = await voterRewards.connect(relayer1).claimReward(1, user1.address)

      await expect(tx1)
        .to.emit(relayerRewardsPool, "RelayerActionRegistered")
        .withArgs(relayer1.address, 1, 2, claimWeight) // 2nd action for relayer1

      // Relayer2 claims for user2 (earns CLAIM action)
      const user2Fee = await voterRewards.getFee(1, user2.address)
      const tx2 = await voterRewards.connect(relayer2).claimReward(1, user2.address)

      await expect(tx2)
        .to.emit(relayerRewardsPool, "RelayerActionRegistered")
        .withArgs(relayer2.address, 1, 2, claimWeight) // 2nd action for relayer2

      // Check that fees were deposited to the pool
      const poolTotalAfterClaims = await relayerRewardsPool.getTotalRewards(1)
      const totalFeesDeposited = user1Fee + user2Fee
      expect(poolTotalAfterClaims - initialPoolTotal).to.equal(totalFeesDeposited)

      // Check that rewards are claimable for both relayers
      const relayer1ClaimableRewards = await relayerRewardsPool.claimableRewards(relayer1.address, 1)
      const relayer2ClaimableRewards = await relayerRewardsPool.claimableRewards(relayer2.address, 1)

      // Both relayers should have equal claimable rewards since they performed the same weighted actions
      expect(relayer1ClaimableRewards).to.be.gt(0n)
      expect(relayer2ClaimableRewards).to.be.gt(0n)
      expect(relayer1ClaimableRewards).to.equal(relayer2ClaimableRewards)

      // Check initial relayer balances
      const initialRelayer1Balance = await b3tr.balanceOf(relayer1.address)
      const initialRelayer2Balance = await b3tr.balanceOf(relayer2.address)

      // Now relayers claim their own rewards from the pool
      const claimTx1 = await relayerRewardsPool.claimRewards(1, relayer1.address)
      await expect(claimTx1)
        .to.emit(relayerRewardsPool, "RelayerRewardsClaimed")
        .withArgs(relayer1.address, 1, relayer1ClaimableRewards)

      const claimTx2 = await relayerRewardsPool.claimRewards(1, relayer2.address)
      await expect(claimTx2)
        .to.emit(relayerRewardsPool, "RelayerRewardsClaimed")
        .withArgs(relayer2.address, 1, relayer2ClaimableRewards)

      // Check final balances - relayers should have received their rewards
      const finalRelayer1Balance = await b3tr.balanceOf(relayer1.address)
      const finalRelayer2Balance = await b3tr.balanceOf(relayer2.address)

      expect(finalRelayer1Balance - initialRelayer1Balance).to.equal(relayer1ClaimableRewards)
      expect(finalRelayer2Balance - initialRelayer2Balance).to.equal(relayer2ClaimableRewards)

      expect(await relayerRewardsPool.claimableRewards(relayer1.address, 1)).to.equal(0n)
      expect(await relayerRewardsPool.claimableRewards(relayer2.address, 1)).to.equal(0n)

      // Verify relayers cannot claim again
      await expect(relayerRewardsPool.claimRewards(1, relayer1.address)).to.be.revertedWithCustomError(
        relayerRewardsPool,
        "RewardsAlreadyClaimed",
      )
      await expect(relayerRewardsPool.claimRewards(1, relayer2.address)).to.be.revertedWithCustomError(
        relayerRewardsPool,
        "RewardsAlreadyClaimed",
      )
    })
  })

  describe("Version", function () {
    it("should return the correct version", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      if (!config) throw new Error("Failed to deploy contracts")

      const { voterRewards } = config

      expect(await voterRewards.version()).to.equal("6")
    })
  })
})
