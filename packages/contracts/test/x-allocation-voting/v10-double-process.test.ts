import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

import { getOrDeployContractInstances, getVot3Tokens, waitForNextBlock, moveBlocks } from "../helpers"
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

describe("XAllocationVoting - V10 Double Process Prevention - @shard14c", function () {
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
  let relayer2: HardhatEthersSigner

  let app1Id: string
  let app2Id: string

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

  async function advancePastSkipWindow(roundId: bigint) {
    const skipWindow = await xAllocationVoting.citizenSkipWindowBlocks()
    const deadline = await xAllocationVoting.roundDeadline(roundId)
    const currentBlock = BigInt(await ethers.provider.getBlockNumber())
    const blocksToMine = deadline - currentBlock - skipWindow
    if (blocksToMine > 0n) await moveBlocks(Number(blocksToMine))
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
    relayer2 = otherAccounts[3]

    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))
    await getVot3Tokens(owner, "10000000")

    // Apps
    await x2EarnApps.connect(creators[0]).submitApp(creators[0].address, creators[0].address, "App1", "uri")
    app1Id = await x2EarnApps.hashAppName("App1")
    await endorseApp(app1Id, otherAccounts[4])

    await x2EarnApps.connect(creators[1]).submitApp(creators[1].address, creators[1].address, "App2", "uri")
    app2Id = await x2EarnApps.hashAppName("App2")
    await endorseApp(app2Id, otherAccounts[5])

    // Passport
    if (!(await veBetterPassport.isCheckEnabled(1))) await veBetterPassport.toggleCheck(1)
    await veBetterPassport.whitelist(citizenA.address)
    await veBetterPassport.whitelist(autoUser.address)

    // VOT3
    await getVot3Tokens(citizenA, "1000")
    await getVot3Tokens(autoUser, "100")

    // Register navigator
    await fundAndApprove(nav1, STAKE)
    await navigatorRegistry.connect(nav1).register(STAKE, "ipfs://nav1")

    // Register relayers
    await relayerRewardsPool.registerRelayer(relayer1.address)
    await relayerRewardsPool.registerRelayer(relayer2.address)
    await relayerRewardsPool.connect(owner).setRelayerFeePercentage(10)

    await bootstrapAndStartEmissions()
    await waitForNextBlock()
  }

  describe("Version check", function () {
    beforeEach(setup)

    it("should report version 10", async function () {
      expect(await xAllocationVoting.version()).to.equal("10")
    })
  })

  describe("castVoteOnBehalfOf double-process prevention", function () {
    beforeEach(setup)

    it("should revert on retry after successful auto-vote", async function () {
      // Enable auto-voting for user
      await xAllocationVoting.connect(autoUser).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)

      // Start a new round
      const roundId = await advanceRound()

      // Relayer1 votes on behalf of autoUser
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser.address, roundId)

      // Relayer2 retries — should revert
      await expect(
        xAllocationVoting.connect(relayer2).castVoteOnBehalfOf(autoUser.address, roundId),
      ).to.be.revertedWithCustomError(xAllocationVoting, "VoteAlreadyProcessed")
    })

    it("should revert on retry after auto-vote skip", async function () {
      // Enable auto-voting for user with an app, then remove personhood
      await xAllocationVoting.connect(autoUser).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)

      // Remove personhood so the vote will be skipped
      await veBetterPassport.removeFromWhitelist(autoUser.address)

      // Start a new round
      const roundId = await advanceRound()

      // Relayer1 tries — skipped (not a person)
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser.address, roundId)).to.emit(
        xAllocationVoting,
        "AutoVoteSkipped",
      )

      // Relayer2 retries — should revert
      await expect(
        xAllocationVoting.connect(relayer2).castVoteOnBehalfOf(autoUser.address, roundId),
      ).to.be.revertedWithCustomError(xAllocationVoting, "VoteAlreadyProcessed")
    })
  })

  describe("castNavigatorVote double-process prevention", function () {
    beforeEach(setup)

    it("should revert on retry after successful navigator vote", async function () {
      // Delegate citizen to navigator
      await vot3.connect(citizenA).approve(await navigatorRegistry.getAddress(), DELEGATE_AMT)
      await navigatorRegistry.connect(citizenA).delegate(nav1.address, DELEGATE_AMT)

      // Start a new round
      const roundId = await advanceRound()

      // Navigator sets preferences
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])

      // Relayer1 votes on behalf of citizen
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)

      // Relayer2 retries — should revert
      await expect(
        xAllocationVoting.connect(relayer2).castNavigatorVote(citizenA.address, roundId),
      ).to.be.revertedWithCustomError(xAllocationVoting, "VoteAlreadyProcessed")
    })

    it("should revert on retry after navigator vote skip (dead navigator)", async function () {
      // Delegate citizen to navigator
      await vot3.connect(citizenA).approve(await navigatorRegistry.getAddress(), DELEGATE_AMT)
      await navigatorRegistry.connect(citizenA).delegate(nav1.address, DELEGATE_AMT)

      // Start a new round
      const roundId = await advanceRound()

      // Deactivate navigator (governance action)
      await navigatorRegistry.connect(owner).deactivateNavigator(nav1.address, 0, false)

      // Relayer1 tries — skip (dead navigator)
      await expect(xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId))
        .to.emit(xAllocationVoting, "NavigatorVoteSkipped")
        .withArgs(citizenA.address, nav1.address, roundId)

      // Relayer2 retries — should revert
      await expect(
        xAllocationVoting.connect(relayer2).castNavigatorVote(citizenA.address, roundId),
      ).to.be.revertedWithCustomError(xAllocationVoting, "VoteAlreadyProcessed")
    })

    it("should revert on retry after navigator vote skip (no preferences past skip window)", async function () {
      // Delegate citizen to navigator
      await vot3.connect(citizenA).approve(await navigatorRegistry.getAddress(), DELEGATE_AMT)
      await navigatorRegistry.connect(citizenA).delegate(nav1.address, DELEGATE_AMT)

      // Start a new round (navigator does NOT set prefs)
      const roundId = await advanceRound()

      // Advance past skip window
      await advancePastSkipWindow(roundId)

      // Relayer1 skips
      await expect(xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId))
        .to.emit(xAllocationVoting, "NavigatorVoteSkipped")
        .withArgs(citizenA.address, nav1.address, roundId)

      // Relayer2 retries — should revert
      await expect(
        xAllocationVoting.connect(relayer2).castNavigatorVote(citizenA.address, roundId),
      ).to.be.revertedWithCustomError(xAllocationVoting, "VoteAlreadyProcessed")
    })
  })
})
