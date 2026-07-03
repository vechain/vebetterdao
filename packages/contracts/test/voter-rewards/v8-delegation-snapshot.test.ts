import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

import { getOrDeployContractInstances } from "../helpers/deploy"
import { bootstrapAndStartEmissions, getVot3Tokens, waitForRoundToEnd, waitForNextBlock } from "../helpers/common"
import { endorseApp } from "../helpers/xnodes"
import {
  B3TR,
  VOT3,
  NavigatorRegistry,
  XAllocationVoting,
  Emissions,
  VoterRewards,
  VeBetterPassport,
  X2EarnApps,
  RelayerRewardsPool,
} from "../../typechain-types"

/**
 * V8 fix: VoterRewards.claimReward must use SNAPSHOT delegation state (not current state).
 *
 * Before V8, a citizen who un-delegated (or whose navigator was deactivated)
 * between round snapshot and claim caused both navigatorFee and relayerFee to
 * be 0 — and because registerRelayerAction(CLAIM) was gated on relayerFee > 0,
 * the pool's expected claim weight was never satisfied → round locked.
 *
 * These tests cover both halves of the V8 fix:
 *   1. Snapshot-state gate: navigatorFee + relayerFee are computed when the
 *      citizen was delegated at the round snapshot, regardless of current state.
 *   2. CLAIM-registration decoupling: registerRelayerAction(CLAIM) fires when
 *      the user qualified at snapshot, even if the fee math evaluates to 0.
 */
describe("VoterRewards - V8 Delegation Snapshot Fix - @shard21", function () {
  let navigatorRegistry: NavigatorRegistry
  let xAllocationVoting: XAllocationVoting
  let voterRewards: VoterRewards
  let b3tr: B3TR
  let vot3: VOT3
  let emissions: Emissions
  let veBetterPassport: VeBetterPassport
  let x2EarnApps: X2EarnApps
  let relayerRewardsPool: RelayerRewardsPool

  let owner: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let creators: HardhatEthersSigner[]

  let nav1: HardhatEthersSigner
  let citizen: HardhatEthersSigner
  let autoUser: HardhatEthersSigner
  let relayer1: HardhatEthersSigner

  let app1Id: string

  const STAKE = ethers.parseEther("50000")
  const DELEGATE_AMT = ethers.parseEther("500")

  const fundAndApprove = async (acct: HardhatEthersSigner, amount: bigint) => {
    await b3tr.connect(owner).transfer(acct.address, amount)
    await b3tr.connect(acct).approve(await navigatorRegistry.getAddress(), amount)
  }

  const advanceRound = async (): Promise<bigint> => {
    const cur = await xAllocationVoting.currentRoundId()
    await waitForRoundToEnd(Number(cur))
    await emissions.distribute()
    return xAllocationVoting.currentRoundId()
  }

  async function setupEcosystem() {
    const d = await getOrDeployContractInstances({ forceDeploy: true })
    if (!d) throw new Error("deploy failed")

    navigatorRegistry = d.navigatorRegistry
    xAllocationVoting = d.xAllocationVoting
    voterRewards = d.voterRewards
    b3tr = d.b3tr
    vot3 = d.vot3
    emissions = d.emissions
    veBetterPassport = d.veBetterPassport
    x2EarnApps = d.x2EarnApps
    relayerRewardsPool = d.relayerRewardsPool
    owner = d.owner
    minterAccount = d.minterAccount
    otherAccounts = d.otherAccounts
    creators = d.creators

    nav1 = otherAccounts[8]
    citizen = otherAccounts[10]
    autoUser = otherAccounts[13]
    relayer1 = otherAccounts[15]

    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))
    await getVot3Tokens(owner, "10000000")

    await x2EarnApps.connect(creators[0]).submitApp(creators[0].address, creators[0].address, "V8App", "uri")
    app1Id = await x2EarnApps.hashAppName("V8App")
    await endorseApp(app1Id, otherAccounts[3])

    await fundAndApprove(nav1, STAKE)
    await navigatorRegistry.connect(nav1).register(STAKE, "ipfs://nav1")

    if (!(await veBetterPassport.isCheckEnabled(1))) await veBetterPassport.toggleCheck(1)
    for (const acct of [citizen, autoUser]) {
      await veBetterPassport.whitelist(acct.address)
    }

    await getVot3Tokens(citizen, "1000")
    await getVot3Tokens(autoUser, "100")

    await relayerRewardsPool.registerRelayer(relayer1.address)
    await relayerRewardsPool.connect(owner).setRelayerFeePercentage(10)

    await bootstrapAndStartEmissions()
    await waitForNextBlock()
  }

  /**
   * Sets up a round in which a citizen is delegated at snapshot and the
   * navigator votes on their behalf. Returns the roundId to claim against.
   */
  async function runDelegatedRound(): Promise<bigint> {
    await navigatorRegistry.connect(citizen).delegate(nav1.address, DELEGATE_AMT)
    await waitForNextBlock()

    const roundId = await advanceRound()

    await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id], [10000])
    await xAllocationVoting.connect(relayer1).castNavigatorVote(citizen.address, roundId)
    expect(await xAllocationVoting.hasVoted(roundId, citizen.address)).to.be.true

    await waitForRoundToEnd(Number(roundId))
    await emissions.distribute()
    return roundId
  }

  beforeEach(async function () {
    await setupEcosystem()
  })

  it("1. citizen un-delegates between snapshot and claim → fees still deducted, CLAIM registered, round unlocks", async function () {
    const roundId = await runDelegatedRound()

    // After cycle ended but before claim: citizen un-delegates.
    await navigatorRegistry.connect(citizen).undelegate()
    expect(await navigatorRegistry.isDelegated(citizen.address)).to.equal(false)
    const snapshot = await xAllocationVoting.roundSnapshot(roundId)
    expect(await navigatorRegistry.isDelegatedAtTimepoint(citizen.address, snapshot)).to.equal(true)

    const completedBefore = await relayerRewardsPool.completedWeightedActions(roundId)
    const claimWeight = await relayerRewardsPool.getClaimWeight()

    await expect(voterRewards.connect(relayer1).claimReward(roundId, citizen.address))
      .to.emit(voterRewards, "NavigatorFeeTaken")
      .and.to.emit(voterRewards, "RelayerFeeTaken")
      .and.to.emit(voterRewards, "RewardClaimedV2")

    const completedAfter = await relayerRewardsPool.completedWeightedActions(roundId)
    expect(completedAfter - completedBefore).to.equal(claimWeight)
  })

  it("2. navigator deactivated between snapshot and claim → fees still deducted, CLAIM registered, round unlocks", async function () {
    const roundId = await runDelegatedRound()

    // After cycle ended but before claim: navigator is deactivated.
    await navigatorRegistry.connect(owner).deactivateNavigator(nav1.address, 0, false)
    const snapshot = await xAllocationVoting.roundSnapshot(roundId)
    expect(await navigatorRegistry.isDelegatedAtTimepoint(citizen.address, snapshot)).to.equal(true)

    const completedBefore = await relayerRewardsPool.completedWeightedActions(roundId)
    const claimWeight = await relayerRewardsPool.getClaimWeight()

    await expect(voterRewards.connect(relayer1).claimReward(roundId, citizen.address))
      .to.emit(voterRewards, "NavigatorFeeTaken")
      .and.to.emit(voterRewards, "RelayerFeeTaken")

    const completedAfter = await relayerRewardsPool.completedWeightedActions(roundId)
    expect(completedAfter - completedBefore).to.equal(claimWeight)
  })

  it("3. citizen stays delegated through claim → behavior unchanged (regression)", async function () {
    const roundId = await runDelegatedRound()

    expect(await navigatorRegistry.isDelegated(citizen.address)).to.equal(true)

    const completedBefore = await relayerRewardsPool.completedWeightedActions(roundId)
    const claimWeight = await relayerRewardsPool.getClaimWeight()

    await expect(voterRewards.connect(relayer1).claimReward(roundId, citizen.address))
      .to.emit(voterRewards, "NavigatorFeeTaken")
      .and.to.emit(voterRewards, "RelayerFeeTaken")

    const completedAfter = await relayerRewardsPool.completedWeightedActions(roundId)
    expect(completedAfter - completedBefore).to.equal(claimWeight)
  })

  it("4. auto-voter unchanged: snapshot auto-vote → fees deducted, CLAIM registered", async function () {
    await xAllocationVoting.connect(autoUser).setUserVotingPreferences([app1Id])
    await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)
    await waitForNextBlock()

    const roundId = await advanceRound()
    await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser.address, roundId)
    await waitForRoundToEnd(Number(roundId))
    await emissions.distribute()

    const completedBefore = await relayerRewardsPool.completedWeightedActions(roundId)
    const claimWeight = await relayerRewardsPool.getClaimWeight()

    await expect(voterRewards.connect(relayer1).claimReward(roundId, autoUser.address))
      .to.emit(voterRewards, "RelayerFeeTaken")
      .and.to.emit(voterRewards, "RewardClaimedV2")
      .and.to.not.emit(voterRewards, "NavigatorFeeTaken")

    const completedAfter = await relayerRewardsPool.completedWeightedActions(roundId)
    expect(completedAfter - completedBefore).to.equal(claimWeight)
  })

  it("5. neither delegated nor auto-voter → no fees, no CLAIM registered", async function () {
    // A plain whitelisted voter who casts their own vote directly (no delegation, no auto-voting).
    const plainVoter = otherAccounts[5]
    await veBetterPassport.whitelist(plainVoter.address)
    await getVot3Tokens(plainVoter, "100")

    const roundId = await advanceRound()
    await xAllocationVoting.connect(plainVoter).castVote(roundId, [app1Id], [ethers.parseEther("50")])
    await waitForRoundToEnd(Number(roundId))
    await emissions.distribute()

    const completedBefore = await relayerRewardsPool.completedWeightedActions(roundId)

    const tx = voterRewards.connect(plainVoter).claimReward(roundId, plainVoter.address)
    await expect(tx).to.emit(voterRewards, "RewardClaimedV2")
    await expect(tx).to.not.emit(voterRewards, "NavigatorFeeTaken")
    await expect(tx).to.not.emit(voterRewards, "RelayerFeeTaken")

    const completedAfter = await relayerRewardsPool.completedWeightedActions(roundId)
    expect(completedAfter).to.equal(completedBefore)
  })
})
