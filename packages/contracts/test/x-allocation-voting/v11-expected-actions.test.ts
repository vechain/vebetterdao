import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

import { getOrDeployContractInstances, getVot3Tokens, waitForNextBlock } from "../helpers"
import { bootstrapAndStartEmissions, waitForRoundToEnd } from "../helpers"
import { endorseApp } from "../helpers/xnodes"
import {
  B3TR,
  VOT3,
  NavigatorRegistry,
  XAllocationVoting,
  Emissions,
  VeBetterPassport,
  X2EarnApps,
  RelayerRewardsPool,
} from "../../typechain-types"

/**
 * V11 fixes two ways a round's expected actions could become permanently unreachable,
 * locking the entire relayer reward pool for that round. Both were observed on mainnet:
 * round 86 for the first, and the second is a live foot-gun any navigator could trip.
 */
describe("XAllocationVoting - V11 Expected Actions Accounting - @shard14c", function () {
  let navigatorRegistry: NavigatorRegistry
  let xAllocationVoting: XAllocationVoting
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
  let citizenA: HardhatEthersSigner
  let autoUser: HardhatEthersSigner
  let relayer1: HardhatEthersSigner

  let app1Id: string
  let app2Id: string
  /** A well-formed app id that was never submitted — isEligibleForVote returns false for it. */
  let ghostAppId: string

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

  async function setup() {
    const d = await getOrDeployContractInstances({ forceDeploy: true })
    if (!d) throw new Error("deploy failed")

    navigatorRegistry = d.navigatorRegistry
    xAllocationVoting = d.xAllocationVoting
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
    citizenA = otherAccounts[10]
    autoUser = otherAccounts[13]
    relayer1 = otherAccounts[15]

    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))
    await getVot3Tokens(owner, "10000000")

    await x2EarnApps.connect(creators[0]).submitApp(creators[0].address, creators[0].address, "App1", "uri")
    app1Id = await x2EarnApps.hashAppName("App1")
    await endorseApp(app1Id, otherAccounts[4])

    await x2EarnApps.connect(creators[1]).submitApp(creators[1].address, creators[1].address, "App2", "uri")
    app2Id = await x2EarnApps.hashAppName("App2")
    await endorseApp(app2Id, otherAccounts[5])

    ghostAppId = await x2EarnApps.hashAppName("ThisAppWasNeverSubmitted")

    if (!(await veBetterPassport.isCheckEnabled(1))) await veBetterPassport.toggleCheck(1)
    await veBetterPassport.whitelist(citizenA.address)
    await veBetterPassport.whitelist(autoUser.address)

    await getVot3Tokens(citizenA, "1000")
    await getVot3Tokens(autoUser, "100")

    await fundAndApprove(nav1, STAKE)
    await navigatorRegistry.connect(nav1).register(STAKE, "ipfs://nav1")

    await relayerRewardsPool.registerRelayer(relayer1.address)
    await relayerRewardsPool.connect(owner).setRelayerFeePercentage(10)

    await bootstrapAndStartEmissions()
    await waitForNextBlock()
  }

  describe("Version check", function () {
    beforeEach(setup)

    it("should report version 11", async function () {
      expect(await xAllocationVoting.version()).to.equal("11")
    })
  })

  describe("Fix 1 — auto-voter who toggles off mid-round", function () {
    beforeEach(setup)

    /**
     * The voter is counted in expected actions at the round snapshot. Toggling auto-voting
     * off deletes their preferences, so castVoteOnBehalfOf lands in the skip branch with
     * auto-voting already false. Before V11 the reduce was nested inside an
     * isAutoVotingEnabled() check reading CURRENT state, so no reduce happened — yet the
     * voter was still marked processed, making every retry revert VoteAlreadyProcessed.
     * Four weighted points (3 vote + 1 claim) stranded, round locked forever.
     */
    it("still reduces expected actions when the voter disabled auto-voting mid-round", async function () {
      await xAllocationVoting.connect(autoUser).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)

      const roundId = await advanceRound()

      // Counted at the snapshot...
      expect(await xAllocationVoting.isUserAutoVotingEnabledForRound(autoUser.address, roundId)).to.be.true

      // ...then the user turns auto-voting off, which also clears their preferences.
      await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)
      expect(await xAllocationVoting.isUserAutoVotingEnabled(autoUser.address)).to.be.false

      const before = await relayerRewardsPool.totalWeightedActions(roundId)

      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser.address, roundId)).to.emit(
        xAllocationVoting,
        "AutoVoteSkipped",
      )

      const after = await relayerRewardsPool.totalWeightedActions(roundId)
      const voteWeight = await relayerRewardsPool.getVoteWeight()
      const claimWeight = await relayerRewardsPool.getClaimWeight()

      expect(after).to.equal(before - (voteWeight + claimWeight))
    })

    it("still reduces expected actions for the ordinary skip (auto-voting left on)", async function () {
      // Guards against the fix over-correcting: the pre-existing path must be unchanged.
      await xAllocationVoting.connect(autoUser).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)

      const roundId = await advanceRound()

      // Not a person → skip branch, with auto-voting still enabled.
      await veBetterPassport.removeFromWhitelist(autoUser.address)

      const before = await relayerRewardsPool.totalWeightedActions(roundId)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser.address, roundId)
      const after = await relayerRewardsPool.totalWeightedActions(roundId)

      const voteWeight = await relayerRewardsPool.getVoteWeight()
      const claimWeight = await relayerRewardsPool.getClaimWeight()
      expect(after).to.equal(before - (voteWeight + claimWeight))

      // And it still disables auto-voting for that user.
      expect(await xAllocationVoting.isUserAutoVotingEnabled(autoUser.address)).to.be.false
    })

    it("does not double-reduce on retry", async function () {
      await xAllocationVoting.connect(autoUser).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)
      const roundId = await advanceRound()
      await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)

      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser.address, roundId)
      const after = await relayerRewardsPool.totalWeightedActions(roundId)

      await expect(
        xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser.address, roundId),
      ).to.be.revertedWithCustomError(xAllocationVoting, "VoteAlreadyProcessed")

      expect(await relayerRewardsPool.totalWeightedActions(roundId)).to.equal(after)
    })
  })

  describe("Fix 2 — navigator preferences containing an ineligible app", function () {
    beforeEach(setup)

    async function delegateAndStartRound(): Promise<bigint> {
      await vot3.connect(citizenA).approve(await navigatorRegistry.getAddress(), DELEGATE_AMT)
      await navigatorRegistry.connect(citizenA).delegate(nav1.address, DELEGATE_AMT)
      return advanceRound()
    }

    /**
     * Before V11 this reverted with GovernorAppNotAvailableForVoting for EVERY citizen of
     * the navigator — and since hasSetPreferences was true, the skip branches were
     * unreachable, so they could be neither voted for nor skipped. One typo in one
     * navigator's preference list locked the whole round's pool.
     */
    it("votes with the eligible apps instead of reverting", async function () {
      const roundId = await delegateAndStartRound()

      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, ghostAppId], [5000, 5000])

      await expect(xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)).to.emit(
        xAllocationVoting,
        "NavigatorVoteCast",
      )

      expect(await xAllocationVoting.hasVoted(roundId, citizenA.address)).to.be.true
    })

    it("gives the citizen's full voting power to the surviving apps", async function () {
      const roundId = await delegateAndStartRound()

      await navigatorRegistry
        .connect(nav1)
        .setAllocationPreferences(roundId, [app1Id, ghostAppId, app2Id], [2500, 5000, 2500])

      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)

      // The ghost app's 50% is redistributed in the navigator's original proportions,
      // so app1 and app2 keep their 1:1 relationship and no voting power is lost.
      const app1Votes = await xAllocationVoting.getAppVotes(roundId, app1Id)
      const app2Votes = await xAllocationVoting.getAppVotes(roundId, app2Id)
      expect(app1Votes + app2Votes).to.equal(DELEGATE_AMT)
      expect(app1Votes).to.equal(app2Votes)
    })

    it("leaves weights untouched when every app is eligible", async function () {
      const roundId = await delegateAndStartRound()

      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [7000, 3000])

      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)

      const app1Votes = await xAllocationVoting.getAppVotes(roundId, app1Id)
      const app2Votes = await xAllocationVoting.getAppVotes(roundId, app2Id)
      expect(app1Votes).to.equal((DELEGATE_AMT * 7000n) / 10000n)
      expect(app2Votes).to.equal((DELEGATE_AMT * 3000n) / 10000n)
      expect(app1Votes + app2Votes).to.equal(DELEGATE_AMT)
    })

    it("skips and reduces expected actions when no preferred app is eligible", async function () {
      const roundId = await delegateAndStartRound()

      const ghost2 = await x2EarnApps.hashAppName("AlsoNeverSubmitted")
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [ghostAppId, ghost2], [5000, 5000])

      const before = await relayerRewardsPool.totalWeightedActions(roundId)

      await expect(xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)).to.emit(
        xAllocationVoting,
        "NavigatorVoteSkipped",
      )

      // Skipping the only vote action also auto-reduces the citizen's claim action.
      const voteWeight = await relayerRewardsPool.getVoteWeight()
      const claimWeight = await relayerRewardsPool.getClaimWeight()
      expect(await relayerRewardsPool.totalWeightedActions(roundId)).to.equal(before - (voteWeight + claimWeight))
    })
  })
})
