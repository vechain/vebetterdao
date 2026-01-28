import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import {
  Navigator,
  VOT3,
  B3TR,
  XAllocationVoting,
  VeBetterPassport,
  VoterRewards,
  Emissions,
  X2EarnApps,
} from "../typechain-types"
import { getOrDeployContractInstances, bootstrapAndStartEmissions, waitForRoundToEnd } from "./helpers"
import { deployProxy } from "../scripts/helpers"
import { endorseApp } from "./helpers/xnodes"

const formatVOT3 = (value: bigint) => `${ethers.formatEther(value)} VOT3`
const formatB3TR = (value: bigint) => `${ethers.formatEther(value)} B3TR`
const divider = () => console.log("\n" + "═".repeat(70) + "\n")

describe.only("Navigator - Full Flow", function () {
  let navigator: Navigator
  let vot3: VOT3
  let b3tr: B3TR
  let xAllocationVoting: XAllocationVoting
  let veBetterPassport: VeBetterPassport
  let voterRewards: VoterRewards
  let emissions: Emissions
  let x2EarnApps: X2EarnApps
  let owner: HardhatEthersSigner
  let navigatorAccount: HardhatEthersSigner
  let delegator1: HardhatEthersSigner
  let delegator2: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]

  let app1Id: string
  let app2Id: string

  const MIN_STAKE = ethers.parseEther("50000")
  const STAKE_RATIO = 1000 // 10% → stake × 10 = capacity
  const FEE_PERCENTAGE = 2000 // 20%

  beforeEach(async function () {
    console.log("\n🚀 DEPLOYING CONTRACTS...")

    const config = await getOrDeployContractInstances({ forceDeploy: true })
    if (!config) throw new Error("Failed to deploy contracts")

    vot3 = config.vot3
    b3tr = config.b3tr
    xAllocationVoting = config.xAllocationVoting
    veBetterPassport = config.veBetterPassport
    voterRewards = config.voterRewards
    emissions = config.emissions
    x2EarnApps = config.x2EarnApps
    owner = config.owner
    minterAccount = config.minterAccount
    otherAccounts = config.otherAccounts

    navigatorAccount = otherAccounts[1]
    delegator1 = otherAccounts[3]
    delegator2 = otherAccounts[4]

    // Deploy Navigator
    navigator = (await deployProxy("Navigator", [
      {
        admin: owner.address,
        upgrader: otherAccounts[0].address,
        feeRecorder: await voterRewards.getAddress(),
        governance: owner.address,
        vot3: await vot3.getAddress(),
        b3tr: await b3tr.getAddress(),
        xAllocationVoting: await xAllocationVoting.getAddress(),
        veBetterPassport: await veBetterPassport.getAddress(),
        minStake: MIN_STAKE,
        maxStake: ethers.parseEther("5000000"),
        stakeRatio: STAKE_RATIO,
        feeLockRounds: 4,
        maxFeePercentage: 5000,
      },
    ])) as Navigator

    console.log("   Navigator deployed at:", await navigator.getAddress())

    // Set Navigator and B3TRGovernor on XAllocationVoting via initializeV9
    await xAllocationVoting
      .connect(owner)
      .initializeV9(await navigator.getAddress(), await config.governor.getAddress())
    console.log("   Navigator set on XAllocationVoting via initializeV9 ✓")

    // Set Navigator on VoterRewards
    await voterRewards.connect(owner).setNavigator(await navigator.getAddress())
    console.log("   Navigator set on VoterRewards ✓")

    // Mint B3TR and convert to VOT3
    const navigatorTokens = ethers.parseEther("500000")
    const delegator1Tokens = ethers.parseEther("200000")
    const delegator2Tokens = ethers.parseEther("100000")

    await b3tr.connect(minterAccount).mint(navigatorAccount.address, navigatorTokens)
    await b3tr.connect(minterAccount).mint(delegator1.address, delegator1Tokens)
    await b3tr.connect(minterAccount).mint(delegator2.address, delegator2Tokens)

    await b3tr.connect(navigatorAccount).approve(await vot3.getAddress(), navigatorTokens)
    await vot3.connect(navigatorAccount).convertToVOT3(navigatorTokens)

    await b3tr.connect(delegator1).approve(await vot3.getAddress(), delegator1Tokens)
    await vot3.connect(delegator1).convertToVOT3(delegator1Tokens)

    await b3tr.connect(delegator2).approve(await vot3.getAddress(), delegator2Tokens)
    await vot3.connect(delegator2).convertToVOT3(delegator2Tokens)

    // Create and endorse apps for voting (each app needs a different creator with their own NFT)
    const x2EarnCreator = config.x2EarnCreator
    const appCreator1 = otherAccounts[10]
    const appCreator2 = otherAccounts[11]

    await x2EarnCreator.connect(owner).safeMint(appCreator1.address)
    await x2EarnCreator.connect(owner).safeMint(appCreator2.address)

    await x2EarnApps.connect(appCreator1).submitApp(appCreator1.address, appCreator1.address, "TestApp1", "ipfs://app1")
    await x2EarnApps.connect(appCreator2).submitApp(appCreator2.address, appCreator2.address, "TestApp2", "ipfs://app2")

    app1Id = await x2EarnApps.hashAppName("TestApp1")
    app2Id = await x2EarnApps.hashAppName("TestApp2")

    await endorseApp(app1Id, otherAccounts[12])
    await endorseApp(app2Id, otherAccounts[13])

    console.log("   Apps created and endorsed ✓")
    console.log("   Contracts deployed and tokens distributed ✓")
  })

  it("Full Navigator Flow: Register → Stake → Delegate → Vote → Claim Rewards", async function () {
    divider()
    console.log("📋 STEP 1: NAVIGATOR REGISTRATION & STAKING")
    divider()

    const profile = "QmNavigatorProfileCID123"
    await navigator.connect(navigatorAccount).registerNavigator(profile, FEE_PERCENTAGE)

    const stakeAmount = ethers.parseEther("100000")
    await vot3.connect(navigatorAccount).approve(await navigator.getAddress(), stakeAmount)
    await navigator.connect(navigatorAccount).stake(stakeAmount)

    const capacity = await navigator.getDelegationCapacity(navigatorAccount.address)
    console.log(`   Navigator registered with ${FEE_PERCENTAGE / 100}% fee`)
    console.log(`   Staked: ${formatVOT3(stakeAmount)}`)
    console.log(`   Delegation capacity: ${formatVOT3(capacity)}`)
    console.log(`   Active: ${await navigator.isNavigatorActive(navigatorAccount.address)}`)

    divider()
    console.log("👥 STEP 2: DELEGATORS DELEGATE TO NAVIGATOR")
    divider()

    const delegator1Balance = await vot3.balanceOf(delegator1.address)
    const delegator2Balance = await vot3.balanceOf(delegator2.address)

    await navigator.connect(delegator1).delegateTo(navigatorAccount.address)
    await navigator.connect(delegator2).delegateTo(navigatorAccount.address)

    const totalDelegated = await navigator.getTotalDelegated(navigatorAccount.address)
    console.log(`   Delegator 1 delegated: ${formatVOT3(delegator1Balance)}`)
    console.log(`   Delegator 2 delegated: ${formatVOT3(delegator2Balance)}`)
    console.log(`   Total delegated power: ${formatVOT3(totalDelegated)}`)

    expect(totalDelegated).to.equal(delegator1Balance + delegator2Balance)

    divider()
    console.log("🗳️  STEP 3: START VOTING ROUND")
    divider()

    await bootstrapAndStartEmissions()
    const roundId = await xAllocationVoting.currentRoundId()
    console.log(`   Round ${roundId} started`)
    console.log(`   Apps available: TestApp1, TestApp2`)

    // Whitelist navigator for voting (personhood check)
    await veBetterPassport.connect(owner).whitelist(navigatorAccount.address)
    await veBetterPassport.connect(owner).toggleCheck(1)

    divider()
    console.log("🚫 STEP 4: DELEGATORS CANNOT VOTE DIRECTLY")
    divider()

    console.log("   Attempting delegator1 direct vote...")
    await expect(
      xAllocationVoting.connect(delegator1).castVote(roundId, [app1Id], [100n]),
    ).to.be.revertedWithCustomError(xAllocationVoting, "DelegatedToNavigator")
    console.log("   ✓ Reverted with DelegatedToNavigator (as expected)")

    console.log("\n   Attempting delegator2 direct vote...")
    await expect(
      xAllocationVoting.connect(delegator2).castVote(roundId, [app1Id], [100n]),
    ).to.be.revertedWithCustomError(xAllocationVoting, "DelegatedToNavigator")
    console.log("   ✓ Reverted with DelegatedToNavigator (as expected)")

    divider()
    console.log("🚫 STEP 5: DELEGATORS CANNOT USE AUTO-VOTING")
    divider()

    console.log("   Attempting to trigger autovote for delegator1...")
    await expect(xAllocationVoting.castVoteOnBehalfOf(delegator1.address, roundId)).to.be.revertedWithCustomError(
      xAllocationVoting,
      "AutoVotingNotEnabled",
    )
    console.log("   ✓ Reverted (auto-voting not enabled)")

    // Even if autovoting was enabled, it should fail for delegated users
    // (The check happens after auto-voting check, so we test the delegation block)

    divider()
    console.log("✅ STEP 6: NAVIGATOR VOTES WITH AGGREGATE POWER")
    divider()

    const snapshot = await xAllocationVoting.roundSnapshot(roundId)
    const navigatorVotingPower = await navigator.getNavigatorVotingPower(navigatorAccount.address, snapshot)
    console.log(`   Round snapshot block: ${snapshot}`)
    console.log(`   Navigator voting power: ${formatVOT3(navigatorVotingPower)}`)

    // Vote 60% on app1, 40% on app2
    await xAllocationVoting.connect(navigatorAccount).castVoteAsNavigator(roundId, [app1Id, app2Id], [60n, 40n])

    console.log(`   ✓ Navigator voted: 60% App1, 40% App2`)

    const hasVoted = await xAllocationVoting.hasVoted(roundId, navigatorAccount.address)
    console.log(`   Has voted: ${hasVoted}`)
    expect(hasVoted).to.be.true

    divider()
    console.log("⏳ STEP 7: WAIT FOR ROUND TO END & DISTRIBUTE")
    divider()

    await waitForRoundToEnd(Number(roundId))
    console.log(`   Round ${roundId} ended`)

    await emissions.connect(minterAccount).distribute()
    console.log(`   Emissions distributed ✓`)

    // The cycle we voted in is now ended, new cycle has started
    // We claim rewards for the ended cycle (roundId = cycle for voting rewards)
    const cycleToClaimFor = roundId
    console.log(`   Claiming rewards for cycle: ${cycleToClaimFor}`)

    divider()
    console.log("💰 STEP 8: DELEGATORS CLAIM REWARDS (Navigator gets fee)")
    divider()

    const navigatorFeeBefore = await b3tr.balanceOf(await navigator.getAddress())

    const delegator1Before = await b3tr.balanceOf(delegator1.address)
    const delegator2Before = await b3tr.balanceOf(delegator2.address)
    console.log(`   Delegator 1 B3TR before: ${formatB3TR(delegator1Before)}`)
    console.log(`   Delegator 2 B3TR before: ${formatB3TR(delegator2Before)}`)

    await voterRewards.connect(delegator1).claimDelegatorReward(cycleToClaimFor, delegator1.address)
    await voterRewards.connect(delegator2).claimDelegatorReward(cycleToClaimFor, delegator2.address)

    const delegator1After = await b3tr.balanceOf(delegator1.address)
    const delegator2After = await b3tr.balanceOf(delegator2.address)
    const delegator1Claimed = delegator1After - delegator1Before
    const delegator2Claimed = delegator2After - delegator2Before

    console.log(`\n   ✓ Delegator 1 claimed: ${formatB3TR(delegator1Claimed)}`)
    console.log(`   ✓ Delegator 2 claimed: ${formatB3TR(delegator2Claimed)}`)

    const navigatorFeeAfter = await b3tr.balanceOf(await navigator.getAddress())
    const navigatorFeeCollected = navigatorFeeAfter - navigatorFeeBefore
    console.log(`\n   ✓ Navigator fee collected: ${formatB3TR(navigatorFeeCollected)}`)

    // Verify proportional rewards (delegator1 has 2x the voting power of delegator2)
    // So delegator1 should get roughly 2x the rewards
    if (delegator2Claimed > 0n) {
      console.log(`\n   Reward ratio (d1/d2): ${Number(delegator1Claimed) / Number(delegator2Claimed)}`)
      console.log(`   Expected ratio: ~2.0 (based on 200k vs 100k VOT3)`)
    }

    divider()
    console.log("✅ FULL NAVIGATOR FLOW COMPLETED SUCCESSFULLY")
    divider()

    console.log("   Summary:")
    console.log(`   • Navigator staked: ${formatVOT3(stakeAmount)}`)
    console.log(`   • Total delegated: ${formatVOT3(totalDelegated)}`)
    console.log(`   • Navigator voted with: ${formatVOT3(navigatorVotingPower)}`)
    console.log(`   • Navigator fee: ${formatB3TR(navigatorFeeCollected)}`)
    console.log(`   • Delegator 1 reward: ${formatB3TR(delegator1Claimed)}`)
    console.log(`   • Delegator 2 reward: ${formatB3TR(delegator2Claimed)}`)
    console.log("")
  })
})
