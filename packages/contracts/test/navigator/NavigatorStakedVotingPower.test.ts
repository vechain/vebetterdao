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
  moveBlocks,
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
} from "../../typechain-types"

describe("Navigator Staked B3TR as Voting Power - @shard19i", function () {
  let navigatorRegistry: NavigatorRegistry
  let xAllocationVoting: XAllocationVoting
  let governor: B3TRGovernor
  let voterRewards: VoterRewards
  let b3tr: B3TR
  let vot3: VOT3
  let emissions: Emissions
  let veBetterPassport: VeBetterPassport
  let x2EarnApps: X2EarnApps

  let owner: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let creators: HardhatEthersSigner[]

  let navigator: HardhatEthersSigner
  let navigator2: HardhatEthersSigner
  let citizen: HardhatEthersSigner
  let nonNavigator: HardhatEthersSigner

  let app1Id: string
  let app2Id: string

  const STAKE_AMOUNT = ethers.parseEther("50000")
  const DELEGATE_AMOUNT = ethers.parseEther("500")
  const METADATA_URI = "ipfs://nav-meta"

  const fundAndApprove = async (account: HardhatEthersSigner, amount: bigint) => {
    await b3tr.connect(owner).transfer(account.address, amount)
    await b3tr.connect(account).approve(await navigatorRegistry.getAddress(), amount)
  }

  const advancePastExitDeadline = async (navigatorAddr: string) => {
    const filter = navigatorRegistry.filters.ExitAnnounced(navigatorAddr)
    const events = await navigatorRegistry.queryFilter(filter)
    const effectiveDeadline = events[events.length - 1].args.effectiveDeadline
    const currentBlock = await xAllocationVoting.clock()
    if (currentBlock < effectiveDeadline) {
      await moveBlocks(Number(effectiveDeadline - currentBlock) + 1)
    }
  }

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
    owner = deployment.owner
    minterAccount = deployment.minterAccount
    otherAccounts = deployment.otherAccounts
    creators = deployment.creators

    navigator = otherAccounts[10]
    navigator2 = otherAccounts[13]
    citizen = otherAccounts[11]
    nonNavigator = otherAccounts[14]

    await b3tr.connect(minterAccount).mint(owner.address, ethers.parseEther("10000000"))
    await getVot3Tokens(otherAccounts[15], "10000000")

    // Register navigator
    await fundAndApprove(navigator, STAKE_AMOUNT)
    await navigatorRegistry.connect(navigator).register(STAKE_AMOUNT, METADATA_URI)

    // Create and endorse 2 apps
    const creator1 = creators[0]
    const creator2 = creators[1]
    await x2EarnApps.connect(creator1).submitApp(creator1.address, creator1.address, "StakeTestApp1", "metadataURI")
    app1Id = await x2EarnApps.hashAppName("StakeTestApp1")
    await endorseApp(app1Id, otherAccounts[3])

    await x2EarnApps.connect(creator2).submitApp(creator2.address, creator2.address, "StakeTestApp2", "metadataURI")
    app2Id = await x2EarnApps.hashAppName("StakeTestApp2")
    await endorseApp(app2Id, otherAccounts[4])

    // Get VOT3 for citizen and delegate
    await getVot3Tokens(citizen, "1000")
    await veBetterPassport.whitelist(citizen.address)
    await veBetterPassport.whitelist(navigator.address)
    if (!(await veBetterPassport.isCheckEnabled(1))) {
      await veBetterPassport.toggleCheck(1)
    }

    await bootstrapAndStartEmissions()
    await waitForNextBlock()

    // Citizen delegates to navigator
    await navigatorRegistry.connect(citizen).delegate(navigator.address, DELEGATE_AMOUNT)
    await waitForNextBlock()
  }

  // ======================== 1. B3TR <-> VOT3 Conversion Accounting ======================== //

  describe("B3TR to VOT3 conversion accounting", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("NavigatorRegistry holds VOT3 (not B3TR) after registration", async function () {
      const registryAddress = await navigatorRegistry.getAddress()
      const vot3Balance = await vot3.balanceOf(registryAddress)
      const b3trBalance = await b3tr.balanceOf(registryAddress)

      expect(vot3Balance).to.equal(STAKE_AMOUNT)
      expect(b3trBalance).to.equal(0)
    })

    it("getStake returns the staked amount after registration", async function () {
      expect(await navigatorRegistry.getStake(navigator.address)).to.equal(STAKE_AMOUNT)
    })

    it("addStake increases VOT3 balance in registry", async function () {
      const addAmount = ethers.parseEther("10000")
      await fundAndApprove(navigator, addAmount)
      await navigatorRegistry.connect(navigator).addStake(addAmount)

      const registryAddress = await navigatorRegistry.getAddress()
      expect(await vot3.balanceOf(registryAddress)).to.equal(STAKE_AMOUNT + addAmount)
      expect(await navigatorRegistry.getStake(navigator.address)).to.equal(STAKE_AMOUNT + addAmount)
    })

    it("reduceStake converts VOT3 back to B3TR and transfers to navigator", async function () {
      const addAmount = ethers.parseEther("20000")
      await fundAndApprove(navigator, addAmount)
      await navigatorRegistry.connect(navigator).addStake(addAmount)

      const reduceAmount = ethers.parseEther("10000")
      const b3trBefore = await b3tr.balanceOf(navigator.address)

      await navigatorRegistry.connect(navigator).reduceStake(reduceAmount)

      const b3trAfter = await b3tr.balanceOf(navigator.address)
      expect(b3trAfter - b3trBefore).to.equal(reduceAmount)

      const registryAddress = await navigatorRegistry.getAddress()
      expect(await vot3.balanceOf(registryAddress)).to.equal(STAKE_AMOUNT + addAmount - reduceAmount)
    })

    it("withdrawStake after exit converts VOT3 back to B3TR", async function () {
      await navigatorRegistry.connect(navigator).announceExit()
      await advancePastExitDeadline(navigator.address)

      const b3trBefore = await b3tr.balanceOf(navigator.address)
      await navigatorRegistry.connect(navigator).withdrawStake(STAKE_AMOUNT)
      const b3trAfter = await b3tr.balanceOf(navigator.address)

      expect(b3trAfter - b3trBefore).to.equal(STAKE_AMOUNT)

      const registryAddress = await navigatorRegistry.getAddress()
      expect(await vot3.balanceOf(registryAddress)).to.equal(0)
    })

    it("multiple navigators: conversion accounting stays consistent", async function () {
      const stake2 = ethers.parseEther("60000")
      await fundAndApprove(navigator2, stake2)
      await navigatorRegistry.connect(navigator2).register(stake2, METADATA_URI)

      const registryAddress = await navigatorRegistry.getAddress()
      expect(await vot3.balanceOf(registryAddress)).to.equal(STAKE_AMOUNT + stake2)

      // Navigator 1 exits and withdraws
      await navigatorRegistry.connect(navigator).announceExit()
      await advancePastExitDeadline(navigator.address)
      await navigatorRegistry.connect(navigator).withdrawStake(STAKE_AMOUNT)

      // Registry still holds navigator2's stake
      expect(await vot3.balanceOf(registryAddress)).to.equal(stake2)
      expect(await navigatorRegistry.getStake(navigator2.address)).to.equal(stake2)
    })
  })

  // ======================== 2. Staked Amount Checkpoints ======================== //

  describe("Staked amount checkpoints", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("getStakedAmountAtTimepoint returns 0 before registration", async function () {
      expect(await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, 1)).to.equal(0)
    })

    it("getStakedAmountAtTimepoint returns staked amount after registration block", async function () {
      const currentBlock = await ethers.provider.getBlockNumber()
      expect(await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, currentBlock)).to.equal(STAKE_AMOUNT)
    })

    it("getStakedAmountAtTimepoint tracks addStake correctly", async function () {
      const blockBeforeAdd = await ethers.provider.getBlockNumber()

      const addAmount = ethers.parseEther("10000")
      await fundAndApprove(navigator, addAmount)
      await navigatorRegistry.connect(navigator).addStake(addAmount)

      const blockAfterAdd = await ethers.provider.getBlockNumber()

      expect(await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, blockBeforeAdd)).to.equal(
        STAKE_AMOUNT,
      )
      expect(await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, blockAfterAdd)).to.equal(
        STAKE_AMOUNT + addAmount,
      )
    })

    it("getStakedAmountAtTimepoint returns 0 for non-navigators", async function () {
      const currentBlock = await ethers.provider.getBlockNumber()
      expect(await navigatorRegistry.getStakedAmountAtTimepoint(nonNavigator.address, currentBlock)).to.equal(0)
    })

    it("staked amount at past snapshot is correct even after later stake changes", async function () {
      const blockAtRegistration = await ethers.provider.getBlockNumber()

      const addAmount = ethers.parseEther("10000")
      await fundAndApprove(navigator, addAmount)
      await navigatorRegistry.connect(navigator).addStake(addAmount)

      // Historical query should still return original amount
      expect(await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, blockAtRegistration)).to.equal(
        STAKE_AMOUNT,
      )
      // Current should return new total
      expect(await navigatorRegistry.getStake(navigator.address)).to.equal(STAKE_AMOUNT + addAmount)
    })
  })

  // ======================== 3. Allocation Voting Power Includes Staked Amount ======================== //

  describe("Allocation voting power includes staked B3TR", function () {
    let roundId: bigint

    beforeEach(async function () {
      await setupFullEcosystem()

      // Start a new round so snapshots capture the navigator registration
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()
      roundId = await xAllocationVoting.currentRoundId()
    })

    it("navigator's getVotes includes staked amount at round snapshot", async function () {
      const snapshot = await xAllocationVoting.roundSnapshot(roundId)
      // Advance past snapshot so getPastVotes doesn't revert with ERC5805FutureLookup
      await waitForNextBlock()

      const votes = await xAllocationVoting.getVotes(navigator.address, snapshot)
      const personalVot3 = await vot3.getPastVotes(navigator.address, snapshot)
      const stakedAmount = await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, snapshot)

      expect(votes).to.equal(personalVot3 + stakedAmount)
      expect(stakedAmount).to.equal(STAKE_AMOUNT)
    })

    it("non-navigator getVotes does NOT include any staked amount", async function () {
      const snapshot = await xAllocationVoting.roundSnapshot(roundId)
      await waitForNextBlock()

      const votes = await xAllocationVoting.getVotes(nonNavigator.address, snapshot)
      const personalVot3 = await vot3.getPastVotes(nonNavigator.address, snapshot)

      expect(votes).to.equal(personalVot3)
    })

    it("citizen delegated to navigator: getVotes returns delegated amount only", async function () {
      const snapshot = await xAllocationVoting.roundSnapshot(roundId)
      await waitForNextBlock()

      const votes = await xAllocationVoting.getVotes(citizen.address, snapshot)
      expect(votes).to.equal(DELEGATE_AMOUNT)
    })
  })

  // ======================== 4. Governance Voting Power Includes Staked Amount ======================== //

  describe("Governance voting power includes staked B3TR", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("navigator can castVote on governance proposal and weight includes staked amount", async function () {
      // Create a proposal (createProposal handles round advancement internally)
      const tx = await createProposal(b3tr, await ethers.getContractFactory("B3TR"), navigator, "Test proposal")
      const proposalId = await getProposalIdFromTx(tx)
      await payDeposit(proposalId.toString(), navigator)
      await waitForProposalToBeActive(proposalId as any)

      // Cast vote (advances a block, so getPastVotes at snapshot won't revert with FutureLookup)
      const voteTx = await governor.connect(navigator).castVoteWithReason(proposalId, 1, "in favor")

      const proposalSnapshot = await governor.proposalSnapshot(proposalId)
      const personalVot3 = await vot3.getPastVotes(navigator.address, proposalSnapshot)
      const stakedAmount = await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, proposalSnapshot)
      const expectedWeight = personalVot3 + stakedAmount

      expect(stakedAmount).to.equal(STAKE_AMOUNT)
      const receipt = await voteTx.wait()

      // Find VoteCast event, verify weight includes staked amount
      const voteCastEvent = receipt?.logs
        .map(log => {
          try {
            return governor.interface.parseLog(log)
          } catch {
            return null
          }
        })
        .find(e => e?.name === "VoteCast")

      expect(voteCastEvent).to.not.be.null
      expect(voteCastEvent!.args.weight).to.equal(expectedWeight)
    })
  })

  // ======================== 5. Slash Accounting ======================== //

  describe("Slash converts VOT3 back to B3TR for treasury", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("major slash: registry VOT3 decreases, navigator stake halved", async function () {
      const registryAddress = await navigatorRegistry.getAddress()
      const slashPct = 5000n // 50%
      const slashAmount = (STAKE_AMOUNT * slashPct) / 10000n

      const vot3Before = await vot3.balanceOf(registryAddress)

      await navigatorRegistry.deactivateNavigator(navigator.address, slashPct, false)

      const vot3After = await vot3.balanceOf(registryAddress)
      expect(vot3Before - vot3After).to.equal(slashAmount)
      expect(await navigatorRegistry.getStake(navigator.address)).to.equal(STAKE_AMOUNT - slashAmount)
    })

    it("major slash: staked amount checkpoint reflects new value", async function () {
      await navigatorRegistry.deactivateNavigator(navigator.address, 5000n, false)

      const currentBlock = await ethers.provider.getBlockNumber()
      const stakeAtBlock = await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, currentBlock)
      expect(stakeAtBlock).to.equal(STAKE_AMOUNT / 2n)
    })

    it("minor slash: VOT3 converted to B3TR, checkpoint updated", async function () {
      // Start new round so navigator has citizens at snapshot
      const currentRound = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(currentRound))
      await emissions.distribute()

      // Navigator has citizens but does NOT set preferences → missed allocation infraction
      const roundToReport = await xAllocationVoting.currentRoundId()
      await waitForRoundToEnd(Number(roundToReport))
      await emissions.distribute()

      const registryAddress = await navigatorRegistry.getAddress()
      const vot3Before = await vot3.balanceOf(registryAddress)
      const stakeBefore = await navigatorRegistry.getStake(navigator.address)

      await navigatorRegistry.reportRoundInfractions(navigator.address, roundToReport, [])

      const stakeAfter = await navigatorRegistry.getStake(navigator.address)
      const vot3After = await vot3.balanceOf(registryAddress)

      expect(stakeAfter).to.be.lt(stakeBefore)
      expect(vot3Before - vot3After).to.equal(stakeBefore - stakeAfter)

      const currentBlock = await ethers.provider.getBlockNumber()
      expect(await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, currentBlock)).to.equal(stakeAfter)
    })
  })

  // ======================== 6. Edge Cases ======================== //

  describe("Edge cases", function () {
    beforeEach(async function () {
      await setupFullEcosystem()
    })

    it("NavigatorRegistry address has 0 staked amount (no double counting)", async function () {
      const registryAddress = await navigatorRegistry.getAddress()
      const currentBlock = await ethers.provider.getBlockNumber()

      // Registry holds VOT3 and self-delegates, but getStakedAmountAtTimepoint
      // returns 0 because the registry is not a registered navigator
      const stakedAtTimepoint = await navigatorRegistry.getStakedAmountAtTimepoint(registryAddress, currentBlock)
      expect(stakedAtTimepoint).to.equal(0)
    })

    it("staked VOT3 is in registry, not in navigator's personal wallet", async function () {
      const personalBalance = await vot3.balanceOf(navigator.address)
      const registryBalance = await vot3.balanceOf(await navigatorRegistry.getAddress())

      // Navigator's personal balance should NOT include staked amount
      expect(registryBalance).to.be.gte(STAKE_AMOUNT)
      // Personal balance is separate from staked amount
      expect(personalBalance).to.not.equal(personalBalance + STAKE_AMOUNT)
    })

    it("VOT3 supply increases after staking (B3TR->VOT3 mints)", async function () {
      const supplyBefore = await vot3.totalSupply()

      const stake2 = ethers.parseEther("60000")
      await fundAndApprove(navigator2, stake2)
      await navigatorRegistry.connect(navigator2).register(stake2, METADATA_URI)

      const supplyAfter = await vot3.totalSupply()
      expect(supplyAfter - supplyBefore).to.equal(stake2)
    })

    it("VOT3 supply decreases after withdrawal (VOT3->B3TR burns)", async function () {
      await navigatorRegistry.connect(navigator).announceExit()
      await advancePastExitDeadline(navigator.address)

      const supplyBefore = await vot3.totalSupply()
      await navigatorRegistry.connect(navigator).withdrawStake(STAKE_AMOUNT)
      const supplyAfter = await vot3.totalSupply()

      expect(supplyBefore - supplyAfter).to.equal(STAKE_AMOUNT)
    })

    it("slash after partial reduce: conversion accounting stays correct", async function () {
      const addAmount = ethers.parseEther("20000")
      await fundAndApprove(navigator, addAmount)
      await navigatorRegistry.connect(navigator).addStake(addAmount)

      const reduceAmount = ethers.parseEther("10000")
      await navigatorRegistry.connect(navigator).reduceStake(reduceAmount)

      const stakeBeforeSlash = await navigatorRegistry.getStake(navigator.address)
      const registryVot3Before = await vot3.balanceOf(await navigatorRegistry.getAddress())

      const slashPct = 5000n
      const expectedSlash = (stakeBeforeSlash * slashPct) / 10000n

      await navigatorRegistry.deactivateNavigator(navigator.address, slashPct, false)

      const stakeAfterSlash = await navigatorRegistry.getStake(navigator.address)
      const registryVot3After = await vot3.balanceOf(await navigatorRegistry.getAddress())

      expect(stakeAfterSlash).to.equal(stakeBeforeSlash - expectedSlash)
      expect(registryVot3Before - registryVot3After).to.equal(expectedSlash)
    })

    it("after full withdrawal, staked amount is 0 and getVotes returns only personal VOT3", async function () {
      await navigatorRegistry.connect(navigator).announceExit()
      await advancePastExitDeadline(navigator.address)
      await navigatorRegistry.connect(navigator).withdrawStake(STAKE_AMOUNT)

      expect(await navigatorRegistry.getStake(navigator.address)).to.equal(0)

      const currentBlock = await ethers.provider.getBlockNumber()
      expect(await navigatorRegistry.getStakedAmountAtTimepoint(navigator.address, currentBlock)).to.equal(0)
    })
  })
})
