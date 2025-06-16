import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it } from "mocha"
import {
  catchRevert,
  getOrDeployContractInstances,
  getVot3Tokens,
  startNewAllocationRound,
  waitForRoundToEnd,
} from "../helpers"
import { endorseApp } from "../helpers/xnodes"

describe.only("AutoVoting", function () {
  it("should allow a permitted address to convert B3TR to VOT3 on behalf of another user", async function () {
    const { b3tr, vot3, minterAccount, otherAccount } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    const user = otherAccount
    const specialWallet = await vot3.getAddress()

    // Mint some B3TR to the user
    await expect(b3tr.connect(minterAccount).mint(user, 1000)).not.to.be.reverted

    // Check initial B3TR balance
    console.log("Initial B3TR balance:", await b3tr.balanceOf(user))

    // User approves the special wallet to spend their B3TR tokens
    await expect(b3tr.connect(user).approve(specialWallet, 100)).not.to.be.reverted

    // Check allowance
    console.log("Allowance:", await b3tr.allowance(user, specialWallet))

    // // Special wallet converts B3TR to VOT3 on behalf of the user
    await expect(vot3.convertToVOT3OnBehalf(user.address, 50)).not.to.be.reverted

    // // Check balances - user should receive the VOT3 tokens
    expect(await b3tr.balanceOf(user)).to.eql(BigInt(950)) // 1000 - 50
    expect(await b3tr.balanceOf(specialWallet)).to.eql(BigInt(50))
    expect(await vot3.balanceOf(user)).to.eql(BigInt(50))
    expect(await vot3.convertedB3trOf(user)).to.eql(BigInt(50))

    // // Special wallet should not receive any VOT3 tokens
    expect(await vot3.balanceOf(specialWallet)).to.eql(BigInt(0))
  })

  it("should not allow conversion on behalf without sufficient allowance", async function () {
    const { b3tr, vot3, minterAccount, otherAccount, otherAccounts } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    const user = otherAccount
    const specialWallet = otherAccounts[0]

    // Mint some B3TR to the user
    await expect(b3tr.connect(minterAccount).mint(user, ethers.parseEther("1000"))).not.to.be.reverted

    // User approves the special wallet for less than the conversion amount
    await expect(b3tr.connect(user).approve(specialWallet.address, ethers.parseEther("30"))).not.to.be.reverted

    // Special wallet tries to convert more than approved amount - should revert
    await catchRevert(vot3.connect(specialWallet).convertToVOT3OnBehalf(user.address, ethers.parseEther("50")))
  })

  it("Manual Users vs Auto-Voting Users: Reward Comparison Across Rounds", async function () {
    const { b3tr, vot3, owner, x2EarnApps, xAllocationVoting, veBetterPassport, voterRewards, otherAccounts } =
      await getOrDeployContractInstances({
        forceDeploy: true,
      })

    console.log("\n=== MANUAL vs AUTO-VOTING COMPARISON ===")
    console.log("Testing how auto-voting compounds rewards vs manual claiming\n")

    // Setup app
    const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
    await x2EarnApps
      .connect(owner)
      .submitApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
    await endorseApp(app1Id, otherAccounts[0])

    // Setup users
    const manualUser1 = otherAccounts[1] // Keeps rewards as B3TR, votes manually
    const manualUser2 = otherAccounts[2] // Keeps rewards as B3TR, votes manually
    const autoUser1 = otherAccounts[3] // Auto-converts rewards to VOT3, uses autovoting
    const autoUser2 = otherAccounts[4] // Auto-converts rewards to VOT3, uses autovoting

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
    await xAllocationVoting.connect(autoUser1).toggleAutovoting()
    await xAllocationVoting.connect(autoUser2).toggleAutovoting()

    // Set voting preferences for auto users
    await xAllocationVoting.connect(autoUser1).setUserVotingPreferences([app1Id])
    await xAllocationVoting.connect(autoUser2).setUserVotingPreferences([app1Id])
    console.log("Autovoting enabled and preferences set for auto users")

    console.log("\nINITIAL SETUP:")
    console.log(`All users start with: ${startingAmount} VOT3`)
    console.log(`Manual Users: Vote manually, keep rewards as B3TR`)
    console.log(`Auto Users: Use autovoting, convert rewards to VOT3\n`)

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

    console.log("All users voted in Round 1 (1000 VOT3 each)")

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

    // Manual users keep B3TR rewards as-is
    console.log(`\nManual users: Keeping B3TR rewards in wallet`)

    // Auto users convert B3TR rewards to VOT3 (simulating automated service)
    const autoUser1B3tr = await b3tr.balanceOf(autoUser1.address)
    const autoUser2B3tr = await b3tr.balanceOf(autoUser2.address)

    console.log(`Auto users: Converting B3TR rewards to VOT3 automatically...`)
    await b3tr.connect(autoUser1).approve(await vot3.getAddress(), autoUser1B3tr)
    await b3tr.connect(autoUser2).approve(await vot3.getAddress(), autoUser2B3tr)

    await vot3.convertToVOT3OnBehalf(autoUser1.address, autoUser1B3tr)
    await vot3.convertToVOT3OnBehalf(autoUser2.address, autoUser2B3tr)

    console.log(`Auto users: Converted ${ethers.formatEther(autoUser1B3tr)} B3TR to VOT3`)

    // Show balances after Round 1
    console.log(`\nBALANCES AFTER ROUND 1:`)
    console.log(
      `Manual User 1: ${ethers.formatEther(await vot3.balanceOf(manualUser1.address))} VOT3 + ${ethers.formatEther(await b3tr.balanceOf(manualUser1.address))} B3TR`,
    )
    console.log(
      `Auto User 1:   ${ethers.formatEther(await vot3.balanceOf(autoUser1.address))} VOT3 + ${ethers.formatEther(await b3tr.balanceOf(autoUser1.address))} B3TR`,
    )

    // ===== ROUND 2 =====
    console.log(`\n=== ROUND 2 ===`)
    await startNewAllocationRound()

    // Check voting power before voting
    const manualVot3Balance = await vot3.balanceOf(manualUser1.address)
    const autoVot3Balance = await vot3.balanceOf(autoUser1.address)

    console.log(`VOTING POWER COMPARISON:`)
    console.log(`Manual User 1: ${ethers.formatEther(manualVot3Balance)} VOT3`)
    console.log(`Auto User 1:   ${ethers.formatEther(autoVot3Balance)} VOT3`)

    // Manual users vote manually
    console.log(`\nManual users voting manually with their VOT3...`)
    await xAllocationVoting.connect(manualUser1).castVote(2, [app1Id], [manualVot3Balance])
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

    console.log(`\nROUND 2 REWARDS COMPARISON:`)
    console.log(`Manual User 1: ${ethers.formatEther(manualUser1R2)} B3TR`)
    console.log(`Auto User 1:   ${ethers.formatEther(autoUser1R2)} B3TR`)

    // ===== FINAL COMPARISON =====
    console.log(`\n=== FINAL RESULTS ===`)

    const totalManualRewards = manualUser1R1 + manualUser1R2
    const totalAutoRewards = autoUser1R1 + autoUser1R2
    const rewardDifference = totalAutoRewards - totalManualRewards

    console.log(`TOTAL REWARDS EARNED:`)
    console.log(`Manual User: ${ethers.formatEther(totalManualRewards)} B3TR`)
    console.log(`Auto User:   ${ethers.formatEther(totalAutoRewards)} B3TR`)
    const totalIncrease = (
      (Number(ethers.formatEther(totalAutoRewards)) / Number(ethers.formatEther(totalManualRewards))) * 100 -
      100
    ).toFixed(1)
    console.log(`DIFFERENCE:  ${ethers.formatEther(rewardDifference)} B3TR (+${totalIncrease}%)`)

    // Assertions
    expect(manualUser1R1).to.equal(autoUser1R1, "Round 1 rewards should be equal")
    expect(autoUser1R2).to.be.greaterThan(manualUser1R2, "Auto user should earn more in Round 2")
    expect(totalAutoRewards).to.be.greaterThan(totalManualRewards, "Auto user should earn more total rewards")
  })
})
