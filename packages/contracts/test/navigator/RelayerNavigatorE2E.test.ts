import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

import { getOrDeployContractInstances } from "../helpers/deploy"
import {
  bootstrapAndStartEmissions,
  getVot3Tokens,
  waitForRoundToEnd,
  waitForNextBlock,
  createProposal,
  payDeposit,
  waitForProposalToBeActive,
  getProposalIdFromTx,
} from "../helpers/common"
import { endorseApp } from "../helpers/xnodes"
import {
  B3TR,
  VOT3,
  NavigatorRegistry,
  XAllocationVoting,
  Emissions,
  VoterRewards,
  VeBetterPassport,
  B3TRGovernor,
  X2EarnApps,
  RelayerRewardsPool,
} from "../../typechain-types"

describe("Relayer + Navigator E2E - @shard20e2e", function () {
  let navigatorRegistry: NavigatorRegistry
  let xAllocationVoting: XAllocationVoting
  let governor: B3TRGovernor
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
  let nav2: HardhatEthersSigner
  let citizenA: HardhatEthersSigner
  let citizenB: HardhatEthersSigner
  let citizenC: HardhatEthersSigner
  let autoUser1: HardhatEthersSigner
  let autoUser2: HardhatEthersSigner
  let relayer1: HardhatEthersSigner
  let relayer2: HardhatEthersSigner

  let app1Id: string
  let app2Id: string

  const STAKE = ethers.parseEther("50000")
  const DELEGATE_AMT = ethers.parseEther("500")
  const CITIZEN_VOT3 = "1000"
  const AUTO_VOT3 = "100"

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

  const createActiveProposal = async (description: string, targetRound: bigint): Promise<bigint> => {
    await getVot3Tokens(owner, "300000")
    await waitForNextBlock()
    const tx = await createProposal(
      b3tr,
      await ethers.getContractFactory("B3TR"),
      owner,
      description,
      "tokenDetails",
      [],
      targetRound.toString(),
    )
    const proposalId = await getProposalIdFromTx(tx)
    await payDeposit(proposalId.toString(), owner)
    return proposalId as bigint
  }

  /**
   * Deploy all contracts, create apps, register navigators, delegate citizens,
   * register relayers, bootstrap emissions. Auto-voting is NOT enabled by default
   * to avoid governance action overcounting — tests that need it call enableAutoVoting().
   */
  async function setupFullEcosystem() {
    const d = await getOrDeployContractInstances({ forceDeploy: true })
    if (!d) throw new Error("deploy failed")

    navigatorRegistry = d.navigatorRegistry
    xAllocationVoting = d.xAllocationVoting
    governor = d.governor
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
    nav2 = otherAccounts[9]
    citizenA = otherAccounts[10]
    citizenB = otherAccounts[11]
    citizenC = otherAccounts[12]
    autoUser1 = otherAccounts[13]
    autoUser2 = otherAccounts[14]
    relayer1 = otherAccounts[15]
    relayer2 = otherAccounts[3]

    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))
    await getVot3Tokens(owner, "10000000")

    // Apps
    await x2EarnApps.connect(creators[0]).submitApp(creators[0].address, creators[0].address, "E2EApp1", "uri")
    app1Id = await x2EarnApps.hashAppName("E2EApp1")
    await endorseApp(app1Id, otherAccounts[3])

    await x2EarnApps.connect(creators[1]).submitApp(creators[1].address, creators[1].address, "E2EApp2", "uri")
    app2Id = await x2EarnApps.hashAppName("E2EApp2")
    await endorseApp(app2Id, otherAccounts[4])

    // Register navigators
    await fundAndApprove(nav1, STAKE)
    await navigatorRegistry.connect(nav1).register(STAKE, "ipfs://nav1")
    await fundAndApprove(nav2, STAKE)
    await navigatorRegistry.connect(nav2).register(STAKE, "ipfs://nav2")

    // Passport whitelist
    if (!(await veBetterPassport.isCheckEnabled(1))) await veBetterPassport.toggleCheck(1)
    for (const acct of [citizenA, citizenB, citizenC, autoUser1, autoUser2]) {
      await veBetterPassport.whitelist(acct.address)
    }

    // VOT3 for citizens
    for (const acct of [citizenA, citizenB, citizenC]) {
      await getVot3Tokens(acct, CITIZEN_VOT3)
    }

    // VOT3 for auto-voting users
    for (const acct of [autoUser1, autoUser2]) {
      await getVot3Tokens(acct, AUTO_VOT3)
    }

    // Register relayers
    await relayerRewardsPool.registerRelayer(relayer1.address)
    await relayerRewardsPool.registerRelayer(relayer2.address)
    await relayerRewardsPool.connect(owner).setRelayerFeePercentage(10)

    await bootstrapAndStartEmissions()
    await waitForNextBlock()

    // Delegate citizens
    await navigatorRegistry.connect(citizenA).delegate(nav1.address, DELEGATE_AMT)
    await navigatorRegistry.connect(citizenB).delegate(nav2.address, DELEGATE_AMT)
    await navigatorRegistry.connect(citizenC).delegate(nav1.address, DELEGATE_AMT)
    await waitForNextBlock()
  }

  /** Enable auto-voting for autoUser1 and autoUser2. Call before the target round starts. */
  const enableAutoVoting = async () => {
    await xAllocationVoting.connect(autoUser1).setUserVotingPreferences([app1Id])
    await xAllocationVoting.connect(autoUser1).toggleAutoVoting(autoUser1.address)
    await xAllocationVoting.connect(autoUser2).setUserVotingPreferences([app2Id])
    await xAllocationVoting.connect(autoUser2).toggleAutoVoting(autoUser2.address)
  }

  // ====================================================================
  // 1. Happy path: all navigators set all choices (with governance)
  // ====================================================================
  describe("1 - Happy path: navigators set all choices, relayer completes everything", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("relayer votes allocation + governance for citizens, claims rewards", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const proposalId = await createActiveProposal("happy-path-proposal", targetRound)

      const roundId = await advanceRound()
      expect(roundId).to.equal(targetRound)
      await waitForProposalToBeActive(proposalId as any)

      // Nav1 sets both allocation and governance
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [6000, 4000])
      await navigatorRegistry.connect(nav1).setProposalDecision(proposalId, 2)

      // Nav2 sets both
      await navigatorRegistry.connect(nav2).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])
      await navigatorRegistry.connect(nav2).setProposalDecision(proposalId, 2)

      // Navigator allocation votes
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenB.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)

      // Navigator governance votes
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenA.address)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenB.address)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenC.address)

      expect(await xAllocationVoting.hasVoted(roundId, citizenA.address)).to.be.true
      expect(await xAllocationVoting.hasVoted(roundId, citizenB.address)).to.be.true
      expect(await governor.hasVoted(proposalId, citizenA.address)).to.be.true

      // End round, voter claims (registers CLAIM actions), pool claim
      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenB.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
      const reward = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      expect(reward).to.be.gt(0n)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
    })
  })

  // ====================================================================
  // 2. Navigator sets allocation but NO governance decision
  // ====================================================================
  describe("2 - Allocation prefs set, no governance decision", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("governance skips, claim auto-reduced, relayer claims rewards", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const proposalId = await createActiveProposal("alloc-no-gov", targetRound)

      const roundId = await advanceRound()
      await waitForProposalToBeActive(proposalId as any)

      // Nav1 sets allocation ONLY
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [6000, 4000])

      // Allocation vote succeeds
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      expect(await xAllocationVoting.hasVoted(roundId, citizenA.address)).to.be.true

      // Governance vote skips (no decision set)
      await expect(governor.connect(relayer1).castNavigatorVote(proposalId, citizenA.address)).to.not.be.reverted

      // citizenA: allocation voted (not reduced), governance reduced.
      // Claim NOT auto-reduced because allocation was cast (userAllocationVoteReduced = false).
      // Relayer must still claim voter rewards for citizenA.

      // Handle other citizens similarly
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenC.address)

      // Nav2 also no governance decision
      await navigatorRegistry.connect(nav2).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenB.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenB.address)

      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenB.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
      const reward = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      expect(reward).to.be.gt(0n)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
    })
  })

  // ====================================================================
  // 3. Navigator sets governance decision but NO allocation prefs
  // Allocation skip reduces vote expectation. Governance vote succeeds and
  // registers voter rewards (both allocation AND governance votes earn rewards).
  // Claim is NOT auto-reduced (_checkAndReduceClaim requires userGovernanceVoteReduced
  // which is only set on skip, not on successful vote). But the citizen earned
  // governance-based rewards, so claimReward succeeds and registers the CLAIM action.
  // ====================================================================
  describe("3 - Governance decision set, no allocation prefs", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("allocation skips, governance votes, citizen still earns rewards via governance, relayer claims", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const proposalId = await createActiveProposal("gov-no-alloc", targetRound)

      const roundId = await advanceRound()
      await waitForProposalToBeActive(proposalId as any)

      // Nav1 sets governance ONLY
      await navigatorRegistry.connect(nav1).setProposalDecision(proposalId, 2)

      // Allocation vote skips (no prefs)
      await expect(xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)).to.emit(
        xAllocationVoting,
        "NavigatorVoteSkipped",
      )
      await expect(xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)).to.emit(
        xAllocationVoting,
        "NavigatorVoteSkipped",
      )

      // Governance vote succeeds — also registers voter rewards via voterRewards.registerVote
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenA.address)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenC.address)
      expect(await governor.hasVoted(proposalId, citizenA.address)).to.be.true

      // citizenB (nav2 no choices → all skips → claim auto-reduced)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenB.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenB.address)

      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()

      // Citizens earned rewards from governance votes — claimReward succeeds
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
      const reward = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      expect(reward).to.be.gt(0n)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
    })
  })

  // ====================================================================
  // 4. Two governance proposals, navigator sets decision for only one
  // ====================================================================
  describe("4 - Two proposals, decision for only one", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("partial governance skip, relayer claims rewards", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n

      const proposalId1 = await createActiveProposal("partial-gov-1", targetRound)
      const proposalId2 = await createActiveProposal("partial-gov-2", targetRound)

      const roundId = await advanceRound()
      await waitForProposalToBeActive(proposalId1 as any)
      await waitForProposalToBeActive(proposalId2 as any)

      expect(await governor.getActiveProposals()).to.deep.equal([proposalId1, proposalId2])

      // Nav1 sets allocation + decision for proposal1 only
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [6000, 4000])
      await navigatorRegistry.connect(nav1).setProposalDecision(proposalId1, 2)

      // citizenA: allocation succeeds, gov proposal1 succeeds, gov proposal2 skips
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId1, citizenA.address)
      await governor.connect(relayer1).castNavigatorVote(proposalId2, citizenA.address)
      expect(await governor.hasVoted(proposalId1, citizenA.address)).to.be.true

      // citizenC same
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId1, citizenC.address)
      await governor.connect(relayer1).castNavigatorVote(proposalId2, citizenC.address)

      // citizenB (nav2 no choices) — skip all
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenB.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId1, citizenB.address)
      await governor.connect(relayer1).castNavigatorVote(proposalId2, citizenB.address)

      // Claim NOT auto-reduced for citizenA/C (allocation was cast → userAllocationVoteReduced = false)

      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)
      // citizenB was fully auto-reduced (all skips)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
      const reward = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      expect(reward).to.be.gt(0n)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
    })
  })

  // ====================================================================
  // 5. Navigator sets no choices at all
  // ====================================================================
  describe("5 - Navigator sets no choices at all", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("all skips, all reductions, relayer claims rewards", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const proposalId = await createActiveProposal("no-choices", targetRound)

      const roundId = await advanceRound()
      await waitForProposalToBeActive(proposalId as any)

      const totalBefore = await relayerRewardsPool.totalActions(roundId)

      // Nav1 + Nav2 set NOTHING

      // Skip all for every citizen
      for (const citizen of [citizenA, citizenB, citizenC]) {
        await xAllocationVoting.connect(relayer1).castNavigatorVote(citizen.address, roundId)
        await governor.connect(relayer1).castNavigatorVote(proposalId, citizen.address)
      }

      // 3 actions per citizen (alloc + gov + claim) × 3 citizens = 9 reductions
      expect(await relayerRewardsPool.totalActions(roundId)).to.equal(totalBefore - 9n)

      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()

      // No voter claims needed — all auto-reduced
      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
    })
  })

  // ====================================================================
  // 6. Dead navigator — immediate skips
  // ====================================================================
  describe("6 - Dead navigator: immediate skips", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("dead nav skips immediately, system does not stale, relayer claims rewards", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const proposalId = await createActiveProposal("dead-nav", targetRound)

      const roundId = await advanceRound()
      await waitForProposalToBeActive(proposalId as any)

      // Kill nav2 after round starts
      await navigatorRegistry.connect(owner).deactivateNavigator(nav2.address, 0, false)

      const totalBefore = await relayerRewardsPool.totalActions(roundId)

      // citizenB: dead nav → immediate skip for alloc + gov → claim auto-reduced
      await expect(xAllocationVoting.connect(relayer1).castNavigatorVote(citizenB.address, roundId)).to.emit(
        xAllocationVoting,
        "NavigatorVoteSkipped",
      )
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenB.address)

      expect(await relayerRewardsPool.totalActions(roundId)).to.equal(totalBefore - 3n)

      // Nav1 alive — set choices and vote
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])
      await navigatorRegistry.connect(nav1).setProposalDecision(proposalId, 2)

      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenA.address)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenC.address)

      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
      const reward = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      expect(reward).to.be.gt(0n)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
    })
  })

  // ====================================================================
  // 7. Mixed: auto-voting users + citizens (no governance proposals)
  // ====================================================================
  describe("7 - Mixed: auto-voting users + citizens with cooperating/non-cooperating navigators", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
      await enableAutoVoting()
    })

    it("exact action accounting, rewards claimable", async function () {
      // No governance proposals → no governance action overcounting for auto-users
      const roundId = await advanceRound()

      const voteWeight = await relayerRewardsPool.getVoteWeight()
      const claimWeight = await relayerRewardsPool.getClaimWeight()

      // allocationUsers = 2 auto + 3 citizens = 5
      // No governance → total = 5 × 2 = 10
      const totalActions = await relayerRewardsPool.totalActions(roundId)
      expect(totalActions).to.equal(10n)
      expect(await relayerRewardsPool.totalWeightedActions(roundId)).to.equal(5n * (voteWeight + claimWeight))

      // Nav1 sets allocation prefs
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [6000, 4000])
      // Nav2 sets nothing

      // Auto-votes
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser1.address, roundId)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser2.address, roundId)

      // Nav1's citizens: vote
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)

      // Nav2's citizen: skip → claim auto-reduced (no gov proposals → only alloc needs reducing)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenB.address, roundId)

      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()

      // Voter claims
      await voterRewards.connect(relayer1).claimReward(roundId, autoUser1.address)
      await voterRewards.connect(relayer1).claimReward(roundId, autoUser2.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)

      const totalW = await relayerRewardsPool.totalWeightedActions(roundId)
      const completedW = await relayerRewardsPool.completedWeightedActions(roundId)
      expect(completedW).to.be.gte(totalW)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
      const reward = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      expect(reward).to.be.gt(0n)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
    })
  })

  // ====================================================================
  // 8. Two relayers splitting work (no governance)
  // ====================================================================
  describe("8 - Two relayers splitting work", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
      await enableAutoVoting()
    })

    it("rewards split proportionally between relayers", async function () {
      const roundId = await advanceRound()

      // Nav1 sets allocation
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])

      // Relayer1 handles autoUser1 + citizenA + citizenC
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser1.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)

      // Relayer2 handles autoUser2 + citizenB (nav2 no prefs → skip)
      await xAllocationVoting.connect(relayer2).castVoteOnBehalfOf(autoUser2.address, roundId)
      await xAllocationVoting.connect(relayer2).castNavigatorVote(citizenB.address, roundId)

      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()

      // Voter claims split by relayer
      await voterRewards.connect(relayer1).claimReward(roundId, autoUser1.address)
      await voterRewards.connect(relayer2).claimReward(roundId, autoUser2.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)

      const r1Weighted = await relayerRewardsPool.totalRelayerWeightedActions(relayer1.address, roundId)
      const r2Weighted = await relayerRewardsPool.totalRelayerWeightedActions(relayer2.address, roundId)
      expect(r1Weighted).to.be.gt(0n)
      expect(r2Weighted).to.be.gt(0n)
      expect(r1Weighted).to.be.gt(r2Weighted)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true

      const claim1 = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      const claim2 = await relayerRewardsPool.claimableRewards(relayer2.address, roundId)
      expect(claim1).to.be.gt(claim2)
      expect(claim1).to.be.gt(0n)
      expect(claim2).to.be.gt(0n)

      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
      await relayerRewardsPool.connect(relayer2).claimRewards(roundId, relayer2.address)
    })
  })

  // ====================================================================
  // 9. No auto-voting users, only navigator citizens
  // ====================================================================
  describe("9 - Only navigator citizens, no auto-voting users", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("system works with citizens only, no governance", async function () {
      const roundId = await advanceRound()

      // 3 citizens × 2 (vote+claim) = 6 total actions
      expect(await relayerRewardsPool.totalActions(roundId)).to.equal(6n)

      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])
      await navigatorRegistry.connect(nav2).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])

      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenB.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)

      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()

      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenB.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
      const reward = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      expect(reward).to.be.gt(0n)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
    })
  })

  // ====================================================================
  // 10. Navigator alive at snapshot, dies mid-round
  // ====================================================================
  describe("10 - Navigator alive at snapshot, dies mid-round", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("mid-round death causes skip, reductions restore claimability", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const proposalId = await createActiveProposal("mid-death", targetRound)

      const roundId = await advanceRound()
      await waitForProposalToBeActive(proposalId as any)

      const totalBefore = await relayerRewardsPool.totalActions(roundId)

      // Kill nav2 mid-round
      await navigatorRegistry.connect(owner).deactivateNavigator(nav2.address, 0, false)

      // citizenB: dead nav → skip alloc + gov → claim auto-reduced
      await expect(xAllocationVoting.connect(relayer1).castNavigatorVote(citizenB.address, roundId)).to.emit(
        xAllocationVoting,
        "NavigatorVoteSkipped",
      )
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenB.address)
      expect(await relayerRewardsPool.totalActions(roundId)).to.equal(totalBefore - 3n)

      // Nav1 alive
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])
      await navigatorRegistry.connect(nav1).setProposalDecision(proposalId, 2)

      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenA.address)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenC.address)

      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)

      const totalW = await relayerRewardsPool.totalWeightedActions(roundId)
      const completedW = await relayerRewardsPool.completedWeightedActions(roundId)
      expect(completedW).to.be.gte(totalW)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
      const reward = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      expect(reward).to.be.gt(0n)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
    })
  })

  // ====================================================================
  // 11. Auto-voting users + governance proposal (no stale)
  // Governance actions are only counted for citizens (governanceUsers),
  // not auto-voting users. This test combines both in the same round.
  // ====================================================================
  describe("11 - Auto-voting users + governance proposal, pool does not stale", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
      await enableAutoVoting()
    })

    it("governance actions counted only for citizens, isRewardClaimable true after all work", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const proposalId = await createActiveProposal("auto-gov", targetRound)

      const roundId = await advanceRound()
      await waitForProposalToBeActive(proposalId as any)

      const voteWeight = await relayerRewardsPool.getVoteWeight()
      const claimWeight = await relayerRewardsPool.getClaimWeight()

      // allocationUsers = 2 auto + 3 citizens = 5 → allocation actions = 5 * 2 = 10
      // governanceUsers = 3 citizens only → governance actions = 1 * 3 = 3
      // total = 10 + 3 = 13
      const totalActions = await relayerRewardsPool.totalActions(roundId)
      expect(totalActions).to.equal(13n)

      const expectedWeighted = 5n * (voteWeight + claimWeight) + 3n * voteWeight
      expect(await relayerRewardsPool.totalWeightedActions(roundId)).to.equal(expectedWeighted)

      // Nav1 sets all choices
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [6000, 4000])
      await navigatorRegistry.connect(nav1).setProposalDecision(proposalId, 2)

      // Nav2 sets nothing → citizenB skips

      // Auto-votes
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser1.address, roundId)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser2.address, roundId)

      // Nav1's citizens: alloc + gov
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenC.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenA.address)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenC.address)

      // Nav2's citizen: alloc skip + gov skip → claim auto-reduced
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenB.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenB.address)

      // End round, voter claims
      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
      await voterRewards.connect(relayer1).claimReward(roundId, autoUser1.address)
      await voterRewards.connect(relayer1).claimReward(roundId, autoUser2.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer1).claimReward(roundId, citizenC.address)

      const totalW = await relayerRewardsPool.totalWeightedActions(roundId)
      const completedW = await relayerRewardsPool.completedWeightedActions(roundId)
      expect(completedW).to.be.gte(totalW)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true
      const reward = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      expect(reward).to.be.gt(0n)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
    })
  })

  // ====================================================================
  // 12. Two relayers with governance, verify proportional reward math
  // ====================================================================
  describe("12 - Two relayers with governance, proportional rewards", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("rewards split proportionally, claim1 + claim2 = totalRewards (minus rounding)", async function () {
      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const proposalId = await createActiveProposal("two-relayer-gov", targetRound)

      const roundId = await advanceRound()
      await waitForProposalToBeActive(proposalId as any)

      const voteWeight = await relayerRewardsPool.getVoteWeight()
      const claimWeight = await relayerRewardsPool.getClaimWeight()

      // Both navigators set all choices
      await navigatorRegistry.connect(nav1).setAllocationPreferences(roundId, [app1Id, app2Id], [6000, 4000])
      await navigatorRegistry.connect(nav1).setProposalDecision(proposalId, 2)
      await navigatorRegistry.connect(nav2).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])
      await navigatorRegistry.connect(nav2).setProposalDecision(proposalId, 2)

      // Relayer1: citizenA (alloc + gov)
      await xAllocationVoting.connect(relayer1).castNavigatorVote(citizenA.address, roundId)
      await governor.connect(relayer1).castNavigatorVote(proposalId, citizenA.address)

      // Relayer2: citizenB (alloc + gov) + citizenC (alloc + gov)
      await xAllocationVoting.connect(relayer2).castNavigatorVote(citizenB.address, roundId)
      await xAllocationVoting.connect(relayer2).castNavigatorVote(citizenC.address, roundId)
      await governor.connect(relayer2).castNavigatorVote(proposalId, citizenB.address)
      await governor.connect(relayer2).castNavigatorVote(proposalId, citizenC.address)

      // End round, voter claims split by relayer
      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
      await voterRewards.connect(relayer1).claimReward(roundId, citizenA.address)
      await voterRewards.connect(relayer2).claimReward(roundId, citizenB.address)
      await voterRewards.connect(relayer2).claimReward(roundId, citizenC.address)

      expect(await relayerRewardsPool.isRewardClaimable(roundId)).to.be.true

      // Verify weighted actions: each citizen = voteWeight (alloc) + voteWeight (gov) + claimWeight
      const perCitizen = voteWeight * 2n + claimWeight
      const r1Weighted = await relayerRewardsPool.totalRelayerWeightedActions(relayer1.address, roundId)
      const r2Weighted = await relayerRewardsPool.totalRelayerWeightedActions(relayer2.address, roundId)
      expect(r1Weighted).to.equal(perCitizen) // 1 citizen
      expect(r2Weighted).to.equal(perCitizen * 2n) // 2 citizens

      const totalRewards = await relayerRewardsPool.getTotalRewards(roundId)
      const claim1 = await relayerRewardsPool.claimableRewards(relayer1.address, roundId)
      const claim2 = await relayerRewardsPool.claimableRewards(relayer2.address, roundId)

      // Proportional: relayer2 did 2x the work of relayer1
      expect(claim2).to.equal(claim1 * 2n)

      // claim1 + claim2 = totalRewards (exact, no rounding dust with these weights)
      expect(claim1 + claim2).to.equal(totalRewards)

      // Both claim successfully
      const bal1Before = await b3tr.balanceOf(relayer1.address)
      const bal2Before = await b3tr.balanceOf(relayer2.address)
      await relayerRewardsPool.connect(relayer1).claimRewards(roundId, relayer1.address)
      await relayerRewardsPool.connect(relayer2).claimRewards(roundId, relayer2.address)
      expect(await b3tr.balanceOf(relayer1.address)).to.equal(bal1Before + claim1)
      expect(await b3tr.balanceOf(relayer2.address)).to.equal(bal2Before + claim2)
    })
  })
})
