import { ethers } from "hardhat"
import { expect } from "chai"
import { describe, it, beforeEach } from "mocha"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { mine } from "@nomicfoundation/hardhat-network-helpers"

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
  GovernorVotesLogic,
} from "../../typechain-types"
import { GovernorVotesLogic__factory } from "../../typechain-types/factories/contracts/governance/libraries/GovernorVotesLogic__factory"

describe("NavigatorRegistry Integration - @shard19g", function () {
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
  let governorVotesLogicLib: GovernorVotesLogic

  let owner: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let creators: HardhatEthersSigner[]

  let navigator: HardhatEthersSigner
  let citizen: HardhatEthersSigner
  let relayer: HardhatEthersSigner

  let app1Id: string
  let app2Id: string

  const STAKE_AMOUNT = ethers.parseEther("50000")
  const DELEGATE_AMOUNT = ethers.parseEther("500")
  const CITIZEN_VOT3 = "1000"
  const METADATA_URI = "ipfs://nav-meta"

  // Helper: fund B3TR to an account and approve NavigatorRegistry
  const fundAndApprove = async (account: HardhatEthersSigner, amount: bigint) => {
    await b3tr.connect(owner).transfer(account.address, amount)
    await b3tr.connect(account).approve(await navigatorRegistry.getAddress(), amount)
  }

  /**
   * Full ecosystem bootstrap:
   * - Deploy all contracts fresh
   * - Create and endorse 2 apps
   * - Register a navigator with B3TR stake
   * - Get VOT3 for citizen and delegate to navigator
   * - Whitelist citizen in passport
   * - Bootstrap and start emissions
   */
  async function setupFullEcosystem() {
    const deployment = await getOrDeployContractInstances({ forceDeploy: true })
    if (!deployment) throw new Error("Failed to deploy contracts")

    navigatorRegistry = deployment.navigatorRegistry
    xAllocationVoting = deployment.xAllocationVoting
    governor = deployment.governor
    voterRewards = deployment.voterRewards
    b3tr = deployment.b3tr
    vot3 = deployment.vot3
    emissions = deployment.emissions
    veBetterPassport = deployment.veBetterPassport
    x2EarnApps = deployment.x2EarnApps
    relayerRewardsPool = deployment.relayerRewardsPool
    governorVotesLogicLib = deployment.governorVotesLogicLib
    owner = deployment.owner
    minterAccount = deployment.minterAccount
    otherAccounts = deployment.otherAccounts
    creators = deployment.creators

    navigator = otherAccounts[10]
    citizen = otherAccounts[11]
    relayer = otherAccounts[12]

    // Mint B3TR to owner for distribution
    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))

    // Create VOT3 supply (maxStakePercentage requires enough VOT3 supply for 50k B3TR stake)
    await getVot3Tokens(otherAccounts[15], "10000000")

    // Register navigator
    await fundAndApprove(navigator, STAKE_AMOUNT)
    await navigatorRegistry.connect(navigator).register(STAKE_AMOUNT, METADATA_URI)

    // Create and endorse 2 apps (each app needs a unique creator with their own NFT)
    const creator1 = creators[0] // otherAccounts[0]
    const creator2 = creators[1] // otherAccounts[1]
    await x2EarnApps.connect(creator1).submitApp(creator1.address, creator1.address, "IntegrationApp1", "metadataURI")
    app1Id = await x2EarnApps.hashAppName("IntegrationApp1")
    await endorseApp(app1Id, otherAccounts[3])

    await x2EarnApps.connect(creator2).submitApp(creator2.address, creator2.address, "IntegrationApp2", "metadataURI")
    app2Id = await x2EarnApps.hashAppName("IntegrationApp2")
    await endorseApp(app2Id, otherAccounts[4])

    // Get VOT3 for citizen
    await getVot3Tokens(citizen, CITIZEN_VOT3)

    // Whitelist citizen in passport
    await veBetterPassport.whitelist(citizen.address)
    if (!(await veBetterPassport.isCheckEnabled(1))) {
      await veBetterPassport.toggleCheck(1)
    }

    // Register relayer on the relayer rewards pool (required for early access period)
    await relayerRewardsPool.registerRelayer(relayer.address)

    // Bootstrap and start emissions
    await bootstrapAndStartEmissions()

    // Wait one block so delegation snapshot is after emissions start
    await waitForNextBlock()

    // Citizen delegates 500 VOT3 to navigator
    await navigatorRegistry.connect(citizen).delegate(navigator.address, DELEGATE_AMOUNT)

    // Wait a block so the delegation checkpoint is recorded
    await waitForNextBlock()
  }

  // ======================== 1. XAllocationVoting: castNavigatorVote ======================== //

  describe("castNavigatorVote on XAllocationVoting", function () {
    let roundId: bigint

    beforeEach(async function () {
      await setupFullEcosystem()

      // Start a new round so the delegation snapshot captures the delegation
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      roundId = await xAllocationVoting.currentRoundId()

      // Navigator sets allocation preferences: 60/40 split
      await navigatorRegistry.connect(navigator).setAllocationPreferences(roundId, [app1Id, app2Id], [6000, 4000])
    })

    it("happy path: cast vote, verify vote counted in round totals", async function () {
      await xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, roundId)

      expect(await xAllocationVoting.hasVoted(roundId, citizen.address)).to.be.true
      const totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.equal(DELEGATE_AMOUNT)
    })

    it("voting power equals delegated amount (500), not full balance (1000)", async function () {
      await xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, roundId)

      // Total votes should be 500 (delegated), not 1000 (full VOT3 balance)
      const totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.equal(ethers.parseEther("500"))

      // Citizen has 1000 VOT3 total
      const citizenBalance = await vot3.balanceOf(citizen.address)
      expect(citizenBalance).to.equal(ethers.parseEther("1000"))
    })

    it("60/40 split: app1 gets 300 weight, app2 gets 200 weight", async function () {
      await xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, roundId)

      // 500 * 6000/10000 = 300
      const app1Votes = await xAllocationVoting.getAppVotes(roundId, app1Id)
      expect(app1Votes).to.equal(ethers.parseEther("300"))

      // 500 * 4000/10000 = 200
      const app2Votes = await xAllocationVoting.getAppVotes(roundId, app2Id)
      expect(app2Votes).to.equal(ethers.parseEther("200"))

      // Total = 300 + 200 = 500
      const totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.equal(ethers.parseEther("500"))
    })

    it("reverts NotDelegatedToNavigator when citizen is not delegated", async function () {
      const nonDelegated = otherAccounts[13]
      await getVot3Tokens(nonDelegated, "1000")
      await veBetterPassport.whitelist(nonDelegated.address)

      await expect(
        xAllocationVoting.connect(relayer).castNavigatorVote(nonDelegated.address, roundId),
      ).to.be.revertedWithCustomError(xAllocationVoting, "NotDelegatedToNavigator")
    })

    it("skips when navigator has no preferences (local round < skip window, always permitted)", async function () {
      // Start another round where navigator hasn't set preferences
      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
      const newRoundId = await xAllocationVoting.currentRoundId()

      // In local config (24-block rounds), CITIZEN_SKIP_WINDOW_BLOCKS (720) always exceeds
      // remaining round blocks, so skip is immediately permitted.
      await expect(xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, newRoundId)).to.emit(
        xAllocationVoting,
        "NavigatorVoteSkipped",
      )
    })

    it("relayer action VOTE is registered for caller", async function () {
      const weightedBefore = await relayerRewardsPool.totalRelayerWeightedActions(relayer.address, roundId)

      await xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, roundId)

      const weightedAfter = await relayerRewardsPool.totalRelayerWeightedActions(relayer.address, roundId)
      expect(weightedAfter).to.be.gt(weightedBefore)
    })
  })

  // ======================== 2. B3TRGovernor: castNavigatorVote ======================== //

  describe("castNavigatorVote on B3TRGovernor", function () {
    let roundId: bigint
    let proposalId: bigint

    beforeEach(async function () {
      await setupFullEcosystem()

      // Advance to a new round so delegation snapshot is captured
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      roundId = await xAllocationVoting.currentRoundId()

      // Give owner VOT3 to create proposals (needs enough for deposit)
      await getVot3Tokens(owner, "300000")
      await waitForNextBlock()

      // Create a proposal
      const tx = await createProposal(b3tr, await ethers.getContractFactory("B3TR"), owner, "Nav integration test")
      proposalId = await getProposalIdFromTx(tx)

      // Pay deposit and wait for proposal to become active
      await payDeposit(proposalId.toString(), owner)
      await waitForProposalToBeActive(proposalId as any)

      // Navigator sets decision: 2 = For (stored as 1-indexed: 1=Against, 2=For, 3=Abstain)
      await navigatorRegistry.connect(navigator).setProposalDecision(proposalId, 2)
    })

    it("happy path: cast navigator vote, verify vote counted as For", async function () {
      await governor.connect(relayer).castNavigatorVote(proposalId, citizen.address)

      expect(await governor.hasVoted(proposalId, citizen.address)).to.be.true

      // proposalVotes returns (againstVotes, forVotes, abstainVotes)
      const [, forVotes] = await governor.proposalVotes(proposalId)
      // forVotes should include the citizen's delegated amount (sqrt-based power)
      expect(forVotes).to.be.gt(0n)
    })

    it("voting power equals delegated amount at proposal snapshot", async function () {
      const tx = await governor.connect(relayer).castNavigatorVote(proposalId, citizen.address)
      const receipt = await tx.wait()

      // Find NavigatorGovernanceVoteCast event (emitted from GovernorVotesLogic library)
      const libraryInterface = GovernorVotesLogic__factory.createInterface()
      const event = receipt?.logs
        .map(log => {
          try {
            return libraryInterface.parseLog({ topics: [...log.topics], data: log.data })
          } catch {
            return null
          }
        })
        .find(e => e?.name === "NavigatorGovernanceVoteCast")

      expect(event).to.not.be.undefined
      // weight arg (index 4) should equal DELEGATE_AMOUNT
      expect(event?.args[4]).to.equal(DELEGATE_AMOUNT)
    })

    it("skips governance vote when no decision set (local round < skip window)", async function () {
      // Create a new proposal without setting a navigator decision
      const nextRound = (await xAllocationVoting.currentRoundId()) + 1n
      const tx2 = await createProposal(
        b3tr,
        await ethers.getContractFactory("B3TR"),
        owner,
        "No decision proposal",
        "tokenDetails",
        [],
        nextRound.toString(),
      )
      const newProposalId = await getProposalIdFromTx(tx2)
      await payDeposit(newProposalId.toString(), owner)
      await waitForProposalToBeActive(newProposalId as any)

      // In local config, skip window (720) > round duration (24), so skip is immediate
      const tx3 = await governor.connect(relayer).castNavigatorVote(newProposalId, citizen.address)
      const receipt = await tx3.wait()

      const libraryInterface = GovernorVotesLogic__factory.createInterface()
      const event = receipt?.logs
        .map(log => {
          try {
            return libraryInterface.parseLog({ topics: [...log.topics], data: log.data })
          } catch {
            return null
          }
        })
        .find(e => e?.name === "NavigatorGovernanceVoteSkipped")

      expect(event).to.not.be.undefined
    })

    it("reverts NotDelegatedToNavigator when citizen is not delegated", async function () {
      const nonDelegated = otherAccounts[14]

      await expect(
        governor.connect(relayer).castNavigatorVote(proposalId, nonDelegated.address),
      ).to.be.revertedWithCustomError(governorVotesLogicLib, "NotDelegatedToNavigator")
    })

    it("registers relayer governance vote action for caller", async function () {
      const proposalRoundId = await governor.proposalStartRound(proposalId)
      const weightedBefore = await relayerRewardsPool.totalRelayerWeightedActions(relayer.address, proposalRoundId)

      await governor.connect(relayer).castNavigatorVote(proposalId, citizen.address)

      const weightedAfter = await relayerRewardsPool.totalRelayerWeightedActions(relayer.address, proposalRoundId)
      expect(weightedAfter - weightedBefore).to.equal(await relayerRewardsPool.getVoteWeight())
    })
  })

  describe("Relayer expected actions with navigator citizens", function () {
    it("startNewRound includes delegated citizens and active governance proposals", async function () {
      await setupFullEcosystem()

      await getVot3Tokens(owner, "300000")
      await waitForNextBlock()

      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const createTx = await createProposal(
        b3tr,
        await ethers.getContractFactory("B3TR"),
        owner,
        "Expected actions proposal",
        "tokenDetails",
        [],
        targetRound.toString(),
      )
      const proposalId = await getProposalIdFromTx(createTx)
      await payDeposit(proposalId.toString(), owner)

      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const newRoundId = await xAllocationVoting.currentRoundId()
      await waitForProposalToBeActive(proposalId as any)

      expect(newRoundId).to.equal(targetRound)
      expect(await governor.getActiveProposals()).to.deep.equal([proposalId])
      expect(await relayerRewardsPool.totalActions(newRoundId)).to.equal(3)
      expect(await relayerRewardsPool.totalWeightedActions(newRoundId)).to.equal(7)
    })

    it("castNavigatorVote skips when navigator has no preferences (after skip window)", async function () {
      await setupFullEcosystem()

      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const roundId = await xAllocationVoting.currentRoundId()

      // Navigator does NOT set preferences for this round
      const totalActionsBefore = await relayerRewardsPool.totalActions(roundId)
      const totalWeightedBefore = await relayerRewardsPool.totalWeightedActions(roundId)
      const voteWeight = await relayerRewardsPool.getVoteWeight()
      const claimWeight = await relayerRewardsPool.getClaimWeight()

      // Advance to skip window (720 blocks before deadline)
      const deadline = await xAllocationVoting.roundDeadline(roundId)
      const currentBlock = BigInt(await ethers.provider.getBlockNumber())
      const blocksToMine = deadline - currentBlock - 720n
      if (blocksToMine > 0n) await mine(Number(blocksToMine))

      // castNavigatorVote should skip (not vote) and reduce allocation vote.
      // With no active governance proposals, claim is also auto-reduced (all vote actions done).
      await xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, roundId)

      // 2 actions reduced: vote + auto-claim
      expect(await relayerRewardsPool.totalActions(roundId)).to.equal(totalActionsBefore - 2n)
      expect(await relayerRewardsPool.totalWeightedActions(roundId)).to.equal(
        totalWeightedBefore - voteWeight - claimWeight,
      )
    })

    it("castNavigatorVote with no preferences skips at round start (local round < skip window)", async function () {
      await setupFullEcosystem()

      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const roundId = await xAllocationVoting.currentRoundId()

      // In local config (24-block rounds), CITIZEN_SKIP_WINDOW_BLOCKS (720) exceeds the round
      // duration, so the skip window is always reached — skip succeeds immediately.
      await expect(xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, roundId)).to.emit(
        xAllocationVoting,
        "NavigatorVoteSkipped",
      )
    })

    it("castNavigatorVote skips immediately when navigator is dead", async function () {
      await setupFullEcosystem()

      await getVot3Tokens(owner, "300000")
      await waitForNextBlock()

      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const createTx = await createProposal(
        b3tr,
        await ethers.getContractFactory("B3TR"),
        owner,
        "Dead navigator proposal",
        "tokenDetails",
        [],
        targetRound.toString(),
      )
      const proposalId = await getProposalIdFromTx(createTx)
      await payDeposit(proposalId.toString(), owner)

      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForProposalToBeActive(proposalId as any)

      // Kill navigator after round starts
      await navigatorRegistry.connect(owner).deactivateNavigator(navigator.address, 0, false)

      const totalActionsBefore = await relayerRewardsPool.totalActions(roundId)

      // Allocation skip — immediate, no skip window needed
      await xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, roundId)

      // Governance skip
      await governor.connect(relayer).castNavigatorVote(proposalId, citizen.address)

      // All vote actions skipped → claim auto-reduced: allocation (1) + governance (1) + claim (1) = 3
      expect(await relayerRewardsPool.totalActions(roundId)).to.equal(totalActionsBefore - 3n)
    })

    it("governance castNavigatorVote skips when navigator has no decision", async function () {
      await setupFullEcosystem()

      await getVot3Tokens(owner, "300000")
      await waitForNextBlock()

      const currentRound = await xAllocationVoting.currentRoundId()
      const targetRound = currentRound + 1n
      const createTx = await createProposal(
        b3tr,
        await ethers.getContractFactory("B3TR"),
        owner,
        "No decision proposal",
        "tokenDetails",
        [],
        targetRound.toString(),
      )
      const proposalId = await getProposalIdFromTx(createTx)
      await payDeposit(proposalId.toString(), owner)

      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForProposalToBeActive(proposalId as any)

      const totalActionsBefore = await relayerRewardsPool.totalActions(roundId)
      const voteWeight = await relayerRewardsPool.getVoteWeight()

      // In local config, skip window (720 blocks) > round duration (24 blocks),
      // so skip is always permitted — no need to advance blocks.
      await governor.connect(relayer).castNavigatorVote(proposalId, citizen.address)

      expect(await relayerRewardsPool.totalActions(roundId)).to.equal(totalActionsBefore - 1n)
    })
  })

  // ======================== 3. VoterRewards: fee deduction ======================== //

  describe("VoterRewards fee deduction", function () {
    let roundId: bigint

    beforeEach(async function () {
      await setupFullEcosystem()

      // Advance to a new round
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      roundId = await xAllocationVoting.currentRoundId()

      // Navigator sets preferences and casts vote for citizen
      await navigatorRegistry.connect(navigator).setAllocationPreferences(roundId, [app1Id, app2Id], [6000, 4000])
      await xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, roundId)

      // End the round so rewards can be claimed
      await waitForRoundToEnd(Number(roundId))
      await emissions.distribute()
    })

    it("navigator fee is deducted from citizen's gross reward on claim", async function () {
      // getReward returns netReward (after all fees), so compute gross from components
      const netReward = await voterRewards.getReward(roundId, citizen.address)
      const netGmReward = await voterRewards.getGMReward(roundId, citizen.address)
      const relayerFee = await voterRewards.getRelayerFee(roundId, citizen.address)
      const navigatorFee = await voterRewards.getNavigatorFee(roundId, citizen.address)
      const grossReward = netReward + netGmReward + relayerFee + navigatorFee

      expect(grossReward).to.be.gt(0n)
      expect(navigatorFee).to.be.gt(0n)

      // Claim reward
      const citizenBalanceBefore = await b3tr.balanceOf(citizen.address)
      await voterRewards.connect(relayer).claimReward(roundId, citizen.address)
      const citizenBalanceAfter = await b3tr.balanceOf(citizen.address)

      // Citizen receives netReward + netGmReward, less than gross reward
      const received = citizenBalanceAfter - citizenBalanceBefore
      expect(received).to.equal(netReward + netGmReward)
      expect(received).to.be.lt(grossReward)
    })

    it("navigator fee = feePercentage (2000 = 20%) of gross reward", async function () {
      const feePercentage = await navigatorRegistry.getFeePercentage()
      expect(feePercentage).to.equal(2000n)

      // Compute gross reward from all components
      const netReward = await voterRewards.getReward(roundId, citizen.address)
      const netGmReward = await voterRewards.getGMReward(roundId, citizen.address)
      const relayerFee = await voterRewards.getRelayerFee(roundId, citizen.address)
      const navigatorFee = await voterRewards.getNavigatorFee(roundId, citizen.address)
      const grossReward = netReward + netGmReward + relayerFee + navigatorFee

      // Fee should be 20% of gross reward
      const expectedFee = (grossReward * 2000n) / 10000n
      expect(navigatorFee).to.equal(expectedFee)
    })

    it("relayer fee is applied on remainder after navigator fee", async function () {
      const grossReward = await voterRewards.getReward(roundId, citizen.address)
      const navigatorFee = await voterRewards.getNavigatorFee(roundId, citizen.address)
      const relayerFee = await voterRewards.getRelayerFee(roundId, citizen.address)

      // Relayer fee is computed on (grossReward - navigatorFee), not on grossReward
      const afterNavFee = grossReward - navigatorFee

      // Use the pool's own calculation to verify
      const expectedRelayerFee = await relayerRewardsPool.calculateRelayerFee(afterNavFee)

      expect(relayerFee).to.equal(expectedRelayerFee)
    })

    it("fee deposited to NavigatorRegistry (check getRoundFee)", async function () {
      const feeBefore = await navigatorRegistry.getRoundFee(navigator.address, roundId)
      expect(feeBefore).to.equal(0n)

      // Read navigator fee before claim (claim resets cycle data)
      const navigatorFee = await voterRewards.getNavigatorFee(roundId, citizen.address)
      expect(navigatorFee).to.be.gt(0n)

      await voterRewards.connect(relayer).claimReward(roundId, citizen.address)

      const feeAfter = await navigatorRegistry.getRoundFee(navigator.address, roundId)
      expect(feeAfter).to.be.gt(0n)

      // Should match the navigator fee amount
      expect(feeAfter).to.equal(navigatorFee)
    })

    it("getNavigatorFee view returns correct amount before claim", async function () {
      // Compute gross reward from all components
      const netReward = await voterRewards.getReward(roundId, citizen.address)
      const netGmReward = await voterRewards.getGMReward(roundId, citizen.address)
      const relayerFee = await voterRewards.getRelayerFee(roundId, citizen.address)
      const navigatorFee = await voterRewards.getNavigatorFee(roundId, citizen.address)
      const grossReward = netReward + netGmReward + relayerFee + navigatorFee

      // Verify the fee matches manual calculation
      const feePercentage = await navigatorRegistry.getFeePercentage()
      const expected = (grossReward * feePercentage) / 10000n
      expect(navigatorFee).to.equal(expected)

      // Verify it's not zero (citizen did vote and has rewards)
      expect(navigatorFee).to.be.gt(0n)
    })
  })

  // ======================== Snapshot-consistent delegation ======================== //

  describe("snapshot-consistent delegation", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("mid-round delegation: getVotes unchanged until next round", async function () {
      const newCitizen = otherAccounts[13]
      await getVot3Tokens(newCitizen, "1000")
      await veBetterPassport.whitelist(newCitizen.address)
      await waitForNextBlock()

      // Advance to a new round
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForNextBlock()

      const snapshot = await xAllocationVoting.roundSnapshot(roundId)

      // getVotes at round snapshot = full balance (not delegated at snapshot)
      const votesBefore = await xAllocationVoting.getVotes(newCitizen.address, snapshot)
      expect(votesBefore).to.equal(ethers.parseEther("1000"))

      // Delegate mid-round
      await navigatorRegistry.connect(newCitizen).delegate(navigator.address, ethers.parseEther("500"))
      await waitForNextBlock()

      // getVotes at round snapshot is STILL full balance (snapshot is before delegation)
      const votesAfter = await xAllocationVoting.getVotes(newCitizen.address, snapshot)
      expect(votesAfter).to.equal(ethers.parseEther("1000"))
    })

    it("mid-round undelegate: citizen blocked from manual vote this round", async function () {
      // Advance to a new round
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForNextBlock()

      // citizen was delegated before round start, so snapshot shows delegation
      // Undelegate mid-round
      await navigatorRegistry.connect(citizen).undelegate()
      await waitForNextBlock()

      // Manual vote should still be blocked (was delegated at snapshot, navigator alive)
      await expect(
        xAllocationVoting.connect(citizen).castVote(roundId, [app1Id], [ethers.parseEther("500")]),
      ).to.be.revertedWithCustomError(xAllocationVoting, "DelegatedToNavigator")
    })

    it("castNavigatorVote uses snapshot navigator, not current", async function () {
      // Advance to a new round
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForNextBlock()

      // Navigator sets preferences
      await navigatorRegistry.connect(navigator).setAllocationPreferences(roundId, [app1Id, app2Id], [5000, 5000])

      // citizen was delegated to navigator at snapshot
      // Undelegate mid-round (current = no navigator, snapshot = navigator)
      await navigatorRegistry.connect(citizen).undelegate()
      await waitForNextBlock()

      // castNavigatorVote should still work (uses snapshot navigator)
      await xAllocationVoting.connect(relayer).castNavigatorVote(citizen.address, roundId)
      expect(await xAllocationVoting.hasVoted(roundId, citizen.address)).to.be.true
    })

    it("getVotes returns full balance when navigator is dead at timepoint", async function () {
      // Deactivate the navigator — checkpoint written at roundDeadline(currentRound)
      await navigatorRegistry.deactivateNavigator(navigator.address, 0, false)

      // Wait for round to end so the timepoint is past the deadline checkpoint
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      await waitForNextBlock()

      const block = await ethers.provider.getBlockNumber()
      const timepoint = block - 1

      // Navigator is dead at this timepoint (after round deadline) => full balance
      const govVotes = await governor.getVotes(citizen.address, timepoint)
      const xAllocVotes = await xAllocationVoting.getVotes(citizen.address, timepoint)

      expect(govVotes).to.equal(ethers.parseEther(CITIZEN_VOT3))
      expect(xAllocVotes).to.equal(ethers.parseEther(CITIZEN_VOT3))
    })

    it("getVotes returns delegated amount at timepoint before navigator death", async function () {
      const blockBeforeDeath = await ethers.provider.getBlockNumber()
      await waitForNextBlock()

      // Deactivate the navigator
      await navigatorRegistry.deactivateNavigator(navigator.address, 0, false)
      await waitForNextBlock()

      // At the timepoint BEFORE death, navigator was alive => returns delegated amount
      const govVotes = await governor.getVotes(citizen.address, blockBeforeDeath)
      const xAllocVotes = await xAllocationVoting.getVotes(citizen.address, blockBeforeDeath)

      expect(govVotes).to.equal(DELEGATE_AMOUNT)
      expect(xAllocVotes).to.equal(DELEGATE_AMOUNT)
    })

    it("double-vote prevention: delegated at snapshot blocks castVote", async function () {
      // Advance to a new round
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForNextBlock()

      // citizen was delegated at snapshot => manual vote should be blocked
      await expect(
        xAllocationVoting.connect(citizen).castVote(roundId, [app1Id], [ethers.parseEther("500")]),
      ).to.be.revertedWithCustomError(xAllocationVoting, "DelegatedToNavigator")
    })

    it("dead navigator before round start allows manual voting", async function () {
      // Deactivate the navigator BEFORE advancing to next round
      await navigatorRegistry.deactivateNavigator(navigator.address, 0, false)

      // Now advance to a new round — snapshot captures navigator as already dead
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      const roundId = await xAllocationVoting.currentRoundId()
      await waitForNextBlock()

      // Manual vote should be allowed (navigator was dead at snapshot)
      await xAllocationVoting.connect(citizen).castVote(roundId, [app1Id], [ethers.parseEther("500")])
      expect(await xAllocationVoting.hasVoted(roundId, citizen.address)).to.be.true
    })

    it("getNavigatorAtTimepoint returns correct navigator at past block", async function () {
      const block = await ethers.provider.getBlockNumber()
      const timepoint = block - 1

      const navAtTimepoint = await navigatorRegistry.getNavigatorAtTimepoint(citizen.address, timepoint)
      expect(navAtTimepoint).to.equal(navigator.address)
    })

    it("getNavigatorAtTimepoint returns zero before delegation", async function () {
      const newCitizen = otherAccounts[14]
      await getVot3Tokens(newCitizen, "1000")
      await waitForNextBlock()

      const block = await ethers.provider.getBlockNumber()
      const timepoint = block - 1

      const navAtTimepoint = await navigatorRegistry.getNavigatorAtTimepoint(newCitizen.address, timepoint)
      expect(navAtTimepoint).to.equal(ethers.ZeroAddress)
    })

    it("isDeactivatedAtTimepoint tracks navigator lifecycle", async function () {
      const blockBeforeExit = await ethers.provider.getBlockNumber()

      // Navigator announces exit — checkpoint is at a FUTURE block (round deadline + notice period)
      await navigatorRegistry.connect(navigator).announceExit()
      await waitForNextBlock()

      // Before exit announcement: not deactivated
      expect(await navigatorRegistry.isDeactivatedAtTimepoint(navigator.address, blockBeforeExit)).to.be.false

      // Immediately after announcement: NOT yet deactivated (checkpoint is in the future)
      const blockAfterExit = await ethers.provider.getBlockNumber()
      expect(await navigatorRegistry.isDeactivatedAtTimepoint(navigator.address, blockAfterExit - 1)).to.be.false

      // But isExiting is true
      expect(await navigatorRegistry.isExiting(navigator.address)).to.be.true
    })

    it("isDelegatedAtTimepoint returns false after undelegation", async function () {
      const blockBefore = await ethers.provider.getBlockNumber()

      await navigatorRegistry.connect(citizen).undelegate()
      await waitForNextBlock()

      const blockAfter = await ethers.provider.getBlockNumber()

      // Was delegated before undelegation
      expect(await navigatorRegistry.isDelegatedAtTimepoint(citizen.address, blockBefore)).to.be.true
      // Not delegated after undelegation
      expect(await navigatorRegistry.isDelegatedAtTimepoint(citizen.address, blockAfter - 1)).to.be.false
    })
  })

  // ======================== 4. VOT3 lock integration ======================== //

  describe("VOT3 lock integration", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("delegate 500 of 1000: transfer 500 OK, transfer 501 fails", async function () {
      // Citizen has 1000 VOT3, 500 delegated => 500 unlocked
      const recipient = otherAccounts[9]

      // Transfer 500 should succeed (exactly the unlocked portion)
      await expect(vot3.connect(citizen).transfer(recipient.address, ethers.parseEther("500"))).to.not.be.reverted

      // Get citizen new balance (should be 500 — all locked)
      const balance = await vot3.balanceOf(citizen.address)
      expect(balance).to.equal(ethers.parseEther("500"))

      // Attempting to transfer even 1 wei should fail now (entire balance is locked)
      await expect(vot3.connect(citizen).transfer(recipient.address, 1n)).to.be.revertedWith(
        "VOT3: transfer exceeds unlocked balance",
      )
    })

    it("undelegate: transfer full balance OK", async function () {
      // Undelegate first
      await navigatorRegistry.connect(citizen).undelegate()

      // Now citizen should be able to transfer full 1000 VOT3
      const balance = await vot3.balanceOf(citizen.address)
      expect(balance).to.equal(ethers.parseEther("1000"))

      const recipient = otherAccounts[9]
      await expect(vot3.connect(citizen).transfer(recipient.address, ethers.parseEther("1000"))).to.not.be.reverted

      expect(await vot3.balanceOf(citizen.address)).to.equal(0n)
    })

    it("convertToB3TR: blocked for locked portion, allowed for unlocked", async function () {
      // Citizen has 1000 VOT3, 500 delegated
      // Converting 500 (unlocked) should succeed
      await vot3.connect(citizen).convertToB3TR(ethers.parseEther("500"))
      expect(await vot3.balanceOf(citizen.address)).to.equal(ethers.parseEther("500"))

      // Converting 1 more should fail (all remaining 500 is locked)
      await expect(vot3.connect(citizen).convertToB3TR(1n)).to.be.revertedWith(
        "VOT3: transfer exceeds unlocked balance",
      )
    })
  })

  // ======================== 5. getVotes reflects delegation ======================== //

  describe("getVotes reflects delegation", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("getVotes returns full balance before delegation", async function () {
      const nonDelegated = otherAccounts[13]
      await getVot3Tokens(nonDelegated, CITIZEN_VOT3)
      await waitForNextBlock()

      const block = await ethers.provider.getBlockNumber()
      const timepoint = block - 1

      const govVotes = await governor.getVotes(nonDelegated.address, timepoint)
      const xAllocVotes = await xAllocationVoting.getVotes(nonDelegated.address, timepoint)

      expect(govVotes).to.equal(ethers.parseEther(CITIZEN_VOT3))
      expect(xAllocVotes).to.equal(ethers.parseEther(CITIZEN_VOT3))
    })

    it("getVotes returns delegated amount when citizen has active navigator", async function () {
      // citizen has 1000 VOT3 and 500 delegated (from setupFullEcosystem)
      const block = await ethers.provider.getBlockNumber()
      const timepoint = block - 1

      const govVotes = await governor.getVotes(citizen.address, timepoint)
      const xAllocVotes = await xAllocationVoting.getVotes(citizen.address, timepoint)

      // Returns the delegated amount (effective participation via navigator)
      expect(govVotes).to.equal(DELEGATE_AMOUNT)
      expect(xAllocVotes).to.equal(DELEGATE_AMOUNT)
    })

    it("getVotes returns full balance after undelegation", async function () {
      await navigatorRegistry.connect(citizen).undelegate()
      await waitForNextBlock()

      const block = await ethers.provider.getBlockNumber()
      const timepoint = block - 1

      const govVotes = await governor.getVotes(citizen.address, timepoint)
      const xAllocVotes = await xAllocationVoting.getVotes(citizen.address, timepoint)

      expect(govVotes).to.equal(ethers.parseEther(CITIZEN_VOT3))
      expect(xAllocVotes).to.equal(ethers.parseEther(CITIZEN_VOT3))
    })

    it("getVotes returns delegated amount when fully delegated", async function () {
      const fullDelegator = otherAccounts[14]
      const fullAmount = ethers.parseEther("800")
      await getVot3Tokens(fullDelegator, "800")
      await waitForNextBlock()

      await navigatorRegistry.connect(fullDelegator).delegate(navigator.address, fullAmount)
      await waitForNextBlock()

      const block = await ethers.provider.getBlockNumber()
      const timepoint = block - 1

      const govVotes = await governor.getVotes(fullDelegator.address, timepoint)
      const xAllocVotes = await xAllocationVoting.getVotes(fullDelegator.address, timepoint)

      expect(govVotes).to.equal(fullAmount)
      expect(xAllocVotes).to.equal(fullAmount)
    })

    it("getQuadraticVotingPower reflects delegated amount", async function () {
      // citizen: 1000 VOT3, 500 delegated => getVotes returns 500 (delegated amount)
      const block = await ethers.provider.getBlockNumber()
      const timepoint = block - 1

      // GovernorVotesLogic: Math.sqrt(votes) * 1e9
      const expectedQVP = BigInt(Math.floor(Math.sqrt(Number(DELEGATE_AMOUNT)))) * 1_000_000_000n

      const qvp = await governor.getQuadraticVotingPower(citizen.address, timepoint)
      expect(qvp).to.equal(expectedQVP)
    })

    it("getTotalVotingPower returns delegated amount on XAllocationVoting", async function () {
      // citizen: 1000 VOT3, 500 delegated => getTotalVotingPower returns 500 (delegated amount)
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()

      const roundId = await xAllocationVoting.currentRoundId()

      // Wait a block so roundSnapshot is in the past (getPastVotes requires past timepoint)
      await waitForNextBlock()

      const roundStart = await xAllocationVoting.roundSnapshot(roundId)
      const totalPower = await xAllocationVoting.getTotalVotingPower(citizen.address, roundStart)

      expect(totalPower).to.equal(DELEGATE_AMOUNT)
    })
  })
})
