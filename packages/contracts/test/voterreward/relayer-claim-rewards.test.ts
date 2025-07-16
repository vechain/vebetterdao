import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it } from "mocha"

import { getOrDeployContractInstances, getVot3Tokens, startNewAllocationRound, waitForRoundToEnd } from "../helpers"
import { endorseApp } from "../helpers/xnodes"

describe.only("VoterRewards V6 - @shard10a", function () {
  describe("Relayer Fee Functionality", function () {
    it("should take a fee when a relayer claims for a user with auto-voting enabled", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      if (!config) throw new Error("Failed to deploy contracts")

      const { voterRewards, xAllocationVoting, b3tr, x2EarnApps, veBetterPassport, owner, otherAccounts } = config

      // Setup roles
      const relayer = otherAccounts[0]
      const user = otherAccounts[1]
      const appOwner = otherAccounts[4]

      // Grant RELAYER_ROLE to the relayer
      const RELAYER_ROLE = await voterRewards.RELAYER_ROLE()
      await voterRewards.connect(owner).grantRole(RELAYER_ROLE, relayer.address)

      await voterRewards.connect(owner).setRelayerFeePercentage(10)

      // Set XAllocationVoting address in VoterRewards
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
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)

      // Wait for the round to end
      await waitForRoundToEnd(1)

      // Check initial balances
      const initialRelayerBalance = await b3tr.balanceOf(relayer.address)
      const initialUserBalance = await b3tr.balanceOf(user.address)

      // Get the expected rewards
      const userReward = await voterRewards.getReward(1, user.address)
      const userGMReward = await voterRewards.getGMReward(1, user.address)
      const userTotalReward = userReward + userGMReward

      // Calculate expected fee (10% of total reward)
      const expectedFee = (userTotalReward * BigInt(10)) / BigInt(100)
      const expectedUserReward = userTotalReward - expectedFee

      // Relayer claims for user (who has auto-voting enabled)
      const tx = await voterRewards.connect(relayer).claimReward(1, user.address)

      // Check for RelayerFeeTaken event
      await expect(tx).to.emit(voterRewards, "RelayerFeeTaken").withArgs(relayer.address, expectedFee, 1, user.address)

      // Check balances after claim
      const relayerBalanceAfter = await b3tr.balanceOf(relayer.address)
      const userBalanceAfter = await b3tr.balanceOf(user.address)

      // Relayer should have received the fee
      expect(relayerBalanceAfter - initialRelayerBalance).to.equal(expectedFee)

      // User should have received the reward minus the fee
      expect(userBalanceAfter - initialUserBalance).to.equal(expectedUserReward)
    })

    it("should not take a fee when a relayer claims for a user without auto-voting enabled", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      if (!config) throw new Error("Failed to deploy contracts")

      const { voterRewards, xAllocationVoting, b3tr, x2EarnApps, veBetterPassport, owner, otherAccounts } = config

      // Setup roles
      const relayer = otherAccounts[0]
      const user = otherAccounts[1]
      const appOwner = otherAccounts[4]

      // Grant RELAYER_ROLE to the relayer
      const RELAYER_ROLE = await voterRewards.RELAYER_ROLE()
      await voterRewards.connect(owner).grantRole(RELAYER_ROLE, relayer.address)

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

      // Should not emit RelayerFeeTaken event
      await expect(tx).to.not.emit(voterRewards, "RelayerFeeTaken")

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

      const { voterRewards, xAllocationVoting, b3tr, x2EarnApps, veBetterPassport, owner, otherAccounts } = config

      // Setup roles
      const user = otherAccounts[1]
      const appOwner = otherAccounts[4]

      // Set XAllocationVoting address in VoterRewards
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
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)

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

    it.only("should handle the case when auto-voting is disabled mid-cycle", async function () {
      const config = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      if (!config) throw new Error("Failed to deploy contracts")

      const { voterRewards, xAllocationVoting, b3tr, x2EarnApps, veBetterPassport, owner, otherAccounts } = config

      // Setup roles
      const relayer = otherAccounts[0]
      const user = otherAccounts[1]
      const appOwner = otherAccounts[4]

      // Grant RELAYER_ROLE to the relayer
      const RELAYER_ROLE = await voterRewards.RELAYER_ROLE()
      await voterRewards.connect(owner).grantRole(RELAYER_ROLE, relayer.address)

      await voterRewards.connect(owner).setRelayerFeePercentage(10)

      // Set XAllocationVoting address in VoterRewards
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
      await xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)

      // User disables auto-voting mid-cycle
      await xAllocationVoting.connect(user).toggleAutoVoting()

      // Wait for the round to end
      await waitForRoundToEnd(1)

      // Get the expected rewards
      const userReward = await voterRewards.getReward(1, user.address)
      const userGMReward = await voterRewards.getGMReward(1, user.address)
      const userTotalReward = userReward + userGMReward

      // Calculate expected fee (10% of total reward)
      const expectedFee = (userTotalReward * BigInt(10)) / BigInt(100)
      const expectedUserReward = userTotalReward - expectedFee

      // Initial balances
      const initialRelayerBalance = await b3tr.balanceOf(relayer.address)
      const initialUserBalance = await b3tr.balanceOf(user.address)

      // Relayer claims for user
      const tx = await voterRewards.connect(relayer).claimReward(1, user.address)

      // Should still emit RelayerFeeTaken event because auto-voting was enabled at cycle start
      await expect(tx).to.emit(voterRewards, "RelayerFeeTaken").withArgs(relayer.address, expectedFee, 1, user.address)

      // Check balances after claim
      const relayerBalanceAfter = await b3tr.balanceOf(relayer.address)
      const userBalanceAfter = await b3tr.balanceOf(user.address)

      // Relayer should have received the fee
      expect(relayerBalanceAfter - initialRelayerBalance).to.equal(expectedFee)

      // User should have received the reward minus the fee
      expect(userBalanceAfter - initialUserBalance).to.equal(expectedUserReward)
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
