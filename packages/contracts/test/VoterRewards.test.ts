import { describe, it } from "mocha"
import {
  catchRevert,
  getOrDeployContractInstances,
  getVot3Tokens,
  levels,
  multipliers,
  waitForNextCycle,
  voteOnApps,
  addAppsToAllocationVoting,
  waitForRoundToEnd,
  bootstrapEmissions,
  upgradeNFTtoLevel,
  waitForNextBlock,
  createProposal,
  getProposalIdFromTx,
  waitForProposalToBeActive,
  ZERO_ADDRESS,
  participateInAllocationVoting,
  upgradeGovernanceToV2,
  startNewAllocationRound,
  addNodeToken,
} from "./helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { createTestConfig } from "./helpers/config"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"
import { deployProxy, upgradeProxy } from "../scripts/helpers"
import { GalaxyMember, VoterRewards, VoterRewardsV1 } from "../typechain-types"
import { time } from "@nomicfoundation/hardhat-network-helpers"
import { endorseApp } from "./helpers/xnodes"

describe("VoterRewards - @shard2", () => {
  describe("Contract parameters", () => {
    it("Should have correct parameters set on deployment", async () => {
      const { voterRewards, owner, galaxyMember, emissions } = await getOrDeployContractInstances({ forceDeploy: true })

      // Contract address checks
      expect(await voterRewards.emissions()).to.equal(await emissions.getAddress())
      expect(await voterRewards.galaxyMember()).to.equal(await galaxyMember.getAddress())

      // Admin role
      expect(await voterRewards.hasRole(await voterRewards.DEFAULT_ADMIN_ROLE(), owner.address)).to.equal(true)

      // NFT Levels multipliers
      for (const level of levels) {
        expect(await voterRewards.levelToMultiplier(level)).to.equal(multipliers[levels.indexOf(level)])
      }
    })

    it("Should be able to set new emissions contract", async () => {
      const { voterRewards, owner, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await voterRewards.connect(owner).setEmissions(otherAccount.address)
      expect(await voterRewards.emissions()).to.equal(otherAccount.address)
    })

    it("Should not be able to set new emissions contract if not admin", async () => {
      const { voterRewards, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await expect(voterRewards.connect(otherAccount).setEmissions(otherAccount.address)).to.be.reverted
    })

    it("Should be able to set new Galaxy Member contract", async () => {
      const { voterRewards, owner, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await voterRewards.connect(owner).setGalaxyMember(otherAccount.address)
      expect(await voterRewards.galaxyMember()).to.equal(otherAccount.address)
    })

    it("Should not be able to set new Galaxy Member contract if not admin", async () => {
      const { voterRewards, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await expect(voterRewards.connect(otherAccount).setGalaxyMember(otherAccount.address)).to.be.reverted
    })

    it("Should not be able to register vote if proposal start is zero", async () => {
      const { voterRewards, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await voterRewards.connect(owner).grantRole(await voterRewards.VOTE_REGISTRAR_ROLE(), otherAccount.address)

      await expect(
        voterRewards
          .connect(otherAccount)
          .registerVote(
            0,
            otherAccount.address,
            ethers.parseEther("1000"),
            ethers.parseEther(Math.sqrt(1000).toString()),
          ),
      ).to.be.reverted
    })

    it("Should revert if admin is set to zero address in initilisation", async () => {
      const config = createLocalConfig()
      const { owner, b3tr, galaxyMember, emissions } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      await expect(
        deployProxy("VoterRewardsV1", [
          ZERO_ADDRESS, // admin
          owner.address, // upgrader
          owner.address, // contractsAddressManager
          await emissions.getAddress(),
          await galaxyMember.getAddress(),
          await b3tr.getAddress(),
          levels,
          multipliers,
        ]),
      ).to.be.reverted
    })

    it("Should not be able to register vote for zero address voter", async () => {
      const { voterRewards, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await voterRewards.connect(owner).grantRole(await voterRewards.VOTE_REGISTRAR_ROLE(), otherAccount.address)

      await expect(
        voterRewards
          .connect(otherAccount)
          .registerVote(1, ZERO_ADDRESS, ethers.parseEther("1000"), ethers.parseEther(Math.sqrt(1000).toString())),
      ).to.be.reverted
    })

    it("Should return correct scaling factor", async () => {
      const { voterRewards } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await voterRewards.SCALING_FACTOR()).to.equal(10 ** 6)
    })

    it("Should return correct b3tr address", async () => {
      const { voterRewards, b3tr } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await voterRewards.b3tr()).to.equal(await b3tr.getAddress())
    })

    it("Should be able to set level to multiplier", async () => {
      const { voterRewards, owner, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await voterRewards.connect(owner).setLevelToMultiplier(1, 2)
      expect(await voterRewards.levelToMultiplier(1)).to.equal(2)

      await expect(voterRewards.connect(owner).setLevelToMultiplier(0, 2)).to.be.reverted // Level cannot be zero
      await expect(voterRewards.connect(owner).setLevelToMultiplier(1, 0)).to.be.reverted // Multiplier cannot be zero

      await expect(voterRewards.connect(otherAccount).setLevelToMultiplier(1, 2)).to.be.reverted // Should not be able to set level to multiplier if not admin
    })

    it("Should be able to set galaxy member address", async () => {
      const { voterRewards, owner, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await voterRewards.connect(owner).setGalaxyMember(otherAccount.address)
      expect(await voterRewards.galaxyMember()).to.equal(otherAccount.address)

      await expect(voterRewards.connect(otherAccount).setGalaxyMember(otherAccount.address)).to.be.reverted // Should not be able to set galaxy member address if not admin
      await expect(voterRewards.connect(owner).setGalaxyMember(ZERO_ADDRESS)).to.be.reverted // Galaxy member address cannot be zero
    })

    it("Should be able to set emissions address", async () => {
      const { voterRewards, owner, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await voterRewards.connect(owner).setEmissions(otherAccount.address)
      expect(await voterRewards.emissions()).to.equal(otherAccount.address)

      await expect(voterRewards.connect(otherAccount).setEmissions(otherAccount.address)).to.be.reverted // Should not be able to set emissions address if not admin
      await expect(voterRewards.connect(owner).setEmissions(ZERO_ADDRESS)).to.be.reverted // Emissions address cannot be zero
    })

    it("Admin should be able to set vote registrar role address", async () => {
      const { voterRewards, owner, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await voterRewards.connect(owner).grantRole(await voterRewards.VOTE_REGISTRAR_ROLE(), otherAccount.address)
    })

    it(" admin should be able to set vote registrar role address", async () => {
      const { voterRewards, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await voterRewards.hasRole(await voterRewards.VOTE_REGISTRAR_ROLE(), otherAccount.address)).to.eql(false)
      await expect(
        voterRewards.connect(otherAccount).grantRole(await voterRewards.VOTE_REGISTRAR_ROLE(), otherAccount.address),
      ).to.be.reverted
    })
  })

  describe("Contract upgradeablity", () => {
    it("Admin should be able to upgrade the contract", async function () {
      const { voterRewards, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("VoterRewards")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await voterRewards.getAddress())

      const UPGRADER_ROLE = await voterRewards.UPGRADER_ROLE()
      expect(await voterRewards.hasRole(UPGRADER_ROLE, owner.address)).to.eql(true)

      await expect(voterRewards.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await voterRewards.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it(" admin should be able to upgrade the contract", async function () {
      const { voterRewards, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("VoterRewards")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await voterRewards.getAddress())

      const UPGRADER_ROLE = await voterRewards.UPGRADER_ROLE()
      expect(await voterRewards.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(voterRewards.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await voterRewards.getAddress())

      expect(newImplAddress.toUpperCase()).to.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.not.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Admin can change UPGRADER_ROLE", async function () {
      const { voterRewards, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("VoterRewards")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await voterRewards.getAddress())

      const UPGRADER_ROLE = await voterRewards.UPGRADER_ROLE()
      expect(await voterRewards.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(voterRewards.connect(owner).grantRole(UPGRADER_ROLE, otherAccount.address)).to.not.be.reverted
      await expect(voterRewards.connect(owner).revokeRole(UPGRADER_ROLE, owner.address)).to.not.be.reverted

      await expect(voterRewards.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not
        .be.reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await voterRewards.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Should not be able to deploy proxy with galaxy member address as zero address", async function () {
      const { owner, emissions, b3tr } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(
        deployProxy("VoterRewardsV1", [
          owner.address,
          owner.address,
          owner.address,
          await emissions.getAddress(),
          ZERO_ADDRESS,
          await b3tr.getAddress(),
          levels,
          multipliers,
        ]),
      ).to.be.reverted
    })

    it("Should not be able to deploy proxy with emissions address as zero address", async function () {
      const { owner, galaxyMember, b3tr } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(
        deployProxy("VoterRewardsV1", [
          owner.address,
          owner.address,
          owner.address,
          ZERO_ADDRESS,
          await galaxyMember.getAddress(),
          await b3tr.getAddress(),
          levels,
          multipliers,
        ]),
      ).to.be.reverted
    })

    it("Should not be able to deploy proxy with b3tr address as zero address", async function () {
      const { owner, emissions, galaxyMember } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(
        deployProxy("VoterRewardsV1", [
          owner.address,
          owner.address,
          owner.address,
          await emissions.getAddress(),
          await galaxyMember.getAddress(),
          ZERO_ADDRESS,
          levels,
          multipliers,
        ]),
      ).to.be.reverted
    })

    it("Should not be able to deploy proxy with incorrect levels and multipliers", async function () {
      const { owner, emissions, galaxyMember, b3tr } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(
        deployProxy("VoterRewardsV1", [
          owner.address,
          owner.address,
          owner.address,
          await emissions.getAddress(),
          await galaxyMember.getAddress(),
          await b3tr.getAddress(),
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          [1, 2, 3, 4, 5, 6, 7, 8, 9], // Incorrect multipliers length should be same as levels length
        ]),
      ).to.be.reverted
    })

    it("Should not be able to deploy proxy with levels empty", async function () {
      const { owner, emissions, galaxyMember, b3tr } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(
        deployProxy("VoterRewardsV1", [
          owner.address,
          owner.address,
          owner.address,
          await emissions.getAddress(),
          await galaxyMember.getAddress(),
          await b3tr.getAddress(),
          [],
          [],
        ]),
      ).to.be.reverted
    })

    it("Should return correct version of the contract", async () => {
      const { voterRewards } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await voterRewards.version()).to.equal("2")
    })

    it("Should not have state conflict after upgrading to V2", async () => {
      const config = createLocalConfig()
      const { owner, b3tr, emissions, galaxyMember, vechainNodesMock } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
        deployMocks: true,
      })

      console.log("Galaxy member address: ", await galaxyMember.getAddress())

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      // Bootstrap emissions
      await bootstrapEmissions()

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(owner)

      const voterRewards = (await deployProxy("VoterRewardsV1", [
        owner.address, // admin
        owner.address, // upgrader
        owner.address, // contractsAddressManager
        await emissions.getAddress(),
        await galaxyMember.getAddress(),
        await b3tr.getAddress(),
        levels,
        multipliers,
      ])) as VoterRewardsV1

      await voterRewards.waitForDeployment()

      let storageSlots = []

      const initialSlot = BigInt("0x114e7ffaaf205d38cd05b17b56f3357806ef2ce889cb4748445ae91cdfc37c00") // Slot 0 of VoterRewardsV1

      for (let i = initialSlot; i < initialSlot + BigInt(100); i++) {
        storageSlots.push(await ethers.provider.getStorage(await voterRewards.getAddress(), i))
      }

      const voterRewardsV2 = (await upgradeProxy(
        "VoterRewardsV1",
        "VoterRewards",
        await voterRewards.getAddress(),
        [],
        {
          version: 2,
        },
      )) as VoterRewards

      const storageSlotsAfter = []

      for (let i = initialSlot; i < initialSlot + BigInt(100); i++) {
        storageSlotsAfter.push(await ethers.provider.getStorage(await voterRewardsV2.getAddress(), i))
      }

      // Check if storage slots are the same after upgrade
      for (let i = 0; i < storageSlots.length; i++) {
        expect(storageSlots[i]).to.equal(storageSlotsAfter[i])
      }
    })
  })

  describe("X Allocation voting rewards", () => {
    it("Should track voting rewards correctly involving multiple voters", async () => {
      const config = createLocalConfig()
      const {
        xAllocationVoting,
        otherAccounts,
        otherAccount,
        xAllocationPool,
        owner,
        voterRewards,
        emissions,
        b3tr,
        minterAccount,
        x2EarnApps,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[0])
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[1])
      const voter2 = otherAccounts[3]
      const voter3 = otherAccounts[4]

      await getVot3Tokens(otherAccount, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      // Bootstrap emissions
      await bootstrapEmissions()

      let tx = await emissions.connect(minterAccount).start()

      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let events = receipt?.logs

      let decodedEvents = events?.map(event => {
        return xAllocationVoting.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      const proposalEvent = decodedEvents.find(event => event?.name === "RoundCreated")

      expect(proposalEvent).to.not.equal(undefined)

      expect(await emissions.getCurrentCycle()).to.equal(1)

      expect(await b3tr.balanceOf(await xAllocationPool.getAddress())).to.equal(config.INITIAL_X_ALLOCATION)

      expect(await emissions.nextCycle()).to.equal(2)

      const roundId = await xAllocationVoting.currentRoundId()

      expect(roundId).to.equal(1)

      expect(await xAllocationVoting.roundDeadline(roundId)).to.lt(await emissions.getNextCycleBlock())

      tx = await xAllocationVoting
        .connect(otherAccount)
        .castVote(roundId, [app1, app2], [ethers.parseEther("300"), ethers.parseEther("200")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      events = receipt?.logs

      decodedEvents = events?.map(event => {
        return voterRewards.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents[0]?.args?.[0]).to.equal(1) // Cycle
      expect(decodedEvents[0]?.args?.[1]).to.equal(otherAccount.address) // Voter
      expect(decodedEvents[0]?.args?.[2]).to.equal(ethers.parseEther("500")) // Votes
      expect(decodedEvents[0]?.args?.[3]).to.equal(ethers.parseEther("22.360679774")) // Reward weight

      expect(await emissions.isCycleEnded(1)).to.equal(false)

      await catchRevert(voterRewards.claimReward(1, otherAccount.address)) // Should not be able to claim rewards before cycle ended

      expect(await voterRewards.cycleToVoterToTotal(1, otherAccount)).to.equal(ethers.parseEther("22.360679774")) // I'm expecting 22.36 because I voted 300 for app1 and 200 for app2 at the first cycle which is 500 and the square root of 500 is 22.36

      tx = await xAllocationVoting
        .connect(voter2)
        .castVote(roundId, [app1, app2], [ethers.parseEther("200"), ethers.parseEther("100")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      expect(await voterRewards.cycleToVoterToTotal(1, voter2)).to.equal(ethers.parseEther("17.320508075")) // I'm expecting 17.32 because I voted 200 for app1 and 100 for app2 at the first cycle which is 300 and the square root of 300 is 17.32

      await catchRevert(voterRewards.claimReward(1, voter2.address)) // Should not be able to claim rewards before cycle ended

      tx = await xAllocationVoting
        .connect(voter3)
        .castVote(roundId, [app1, app2], [ethers.parseEther("100"), ethers.parseEther("500")])
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      expect(await voterRewards.cycleToVoterToTotal(1, voter3)).to.equal(ethers.parseEther("24.494897427")) // I'm expecting 24.49 because I voted 100 for app1 and 500 for app2 at the first cycle which is 600 and the square root of 600 is 24.49

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("600"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app2)
      expect(appVotes).to.eql(ethers.parseEther("800"))

      let totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("1400"))

      // Total voters should be tracked correctly
      let totalVoters = await xAllocationVoting.totalVoters(roundId)
      expect(totalVoters).to.eql(BigInt(3))

      // Voter rewards checks
      expect(await voterRewards.cycleToTotal(1)).to.equal(ethers.parseEther("64.176085276")) // Total votes -> Math.sqrt(500) + Math.sqrt(300) + Math.sqrt(600)
      expect(await voterRewards.cycleToTotal(1)).to.equal(
        (await voterRewards.cycleToVoterToTotal(1, otherAccount)) +
          (await voterRewards.cycleToVoterToTotal(1, voter2)) +
          (await voterRewards.cycleToVoterToTotal(1, voter3)),
      ) // Total votes

      await waitForRoundToEnd(Number(roundId))

      // Votes should be the same after round ended
      appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("600"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app2)
      expect(appVotes).to.eql(ethers.parseEther("800"))

      totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("1400"))

      await waitForNextCycle()

      expect(await emissions.isCycleDistributed(await emissions.nextCycle())).to.equal(false)
      expect(await emissions.isNextCycleDistributable()).to.equal(true)

      // Reward claiming
      expect(await emissions.isCycleDistributed(1)).to.equal(true)
      expect(await b3tr.balanceOf(await voterRewards.getAddress())).to.equal(await emissions.getVote2EarnAmount(1))

      const voter1Rewards = await voterRewards.getReward(1, otherAccount.address)
      const voter2Rewards = await voterRewards.getReward(1, voter2.address)
      const voter3Rewards = await voterRewards.getReward(1, voter3.address)

      tx = await voterRewards.connect(otherAccount).claimReward(1, otherAccount)
      receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      expect(await b3tr.balanceOf(otherAccount.address)).to.equal(voter1Rewards)

      events = receipt?.logs

      decodedEvents = events?.map(event => {
        return voterRewards.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      const rewardClaimedEvent = decodedEvents.find(event => event?.name === "RewardClaimed")

      expect(rewardClaimedEvent?.args?.[0]).to.equal(1) // Cycle
      expect(rewardClaimedEvent?.args?.[1]).to.equal(otherAccount.address) // Voter
      expect(rewardClaimedEvent?.args?.[2]).to.equal(696853966016598011228309n) // Reward

      await voterRewards.connect(voter2).claimReward(1, voter2.address)
      await voterRewards.connect(voter3).claimReward(1, voter3.address)

      await expect(voterRewards.connect(voter2).claimReward(1, ZERO_ADDRESS)).to.be.reverted // Should not be able to claim rewards for zero address

      expect(await b3tr.balanceOf(voter2.address)).to.equal(voter2Rewards)
      expect(await b3tr.balanceOf(voter3.address)).to.equal(voter3Rewards)

      expect(await b3tr.balanceOf(await voterRewards.getAddress())).to.lt(ethers.parseEther("1"))
    })

    it("Should track voting rewards correctly involving multiple voters and multiple rounds", async () => {
      const {
        xAllocationVoting,
        otherAccounts,
        otherAccount: voter1,
        owner,
        voterRewards,
        emissions,
        b3tr,
        minterAccount,
        x2EarnApps,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[0])
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[1])
      const voter2 = otherAccounts[3]
      const voter3 = otherAccounts[4]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      const roundId = await xAllocationVoting.currentRoundId()

      expect(roundId).to.equal(1)

      expect(await xAllocationVoting.roundDeadline(roundId)).to.lt(await emissions.getNextCycleBlock())

      // Vote on apps for the first round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("200"), ethers.parseEther("100")], // Voter 2 votes 200 for app1 and 100 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        roundId, // First round
      )

      expect(await emissions.isCycleEnded(1)).to.equal(false)

      await catchRevert(voterRewards.claimReward(1, voter1.address))

      expect(await voterRewards.cycleToVoterToTotal(1, voter1)).to.equal(ethers.parseEther("31.622776601"))

      expect(await voterRewards.cycleToVoterToTotal(1, voter2)).to.equal(ethers.parseEther("17.320508075"))

      await catchRevert(voterRewards.claimReward(1, voter2.address))

      expect(await voterRewards.cycleToVoterToTotal(1, voter3)).to.equal(ethers.parseEther("31.622776601"))

      // Votes should be tracked correctly
      let appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("1700"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app2)
      expect(appVotes).to.eql(ethers.parseEther("600"))

      let totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("2300"))

      // Total voters should be tracked correctly
      let totalVoters = await xAllocationVoting.totalVoters(roundId)
      expect(totalVoters).to.eql(BigInt(3))

      // Voter rewards checks
      expect(await voterRewards.cycleToTotal(1)).to.equal(ethers.parseEther("80.566061277")) // Total votes -> Math.sqrt(1000) + Math.sqrt(300) + Math.sqrt(1000)
      expect(await voterRewards.cycleToTotal(1)).to.equal(
        (await voterRewards.cycleToVoterToTotal(1, voter1)) +
          (await voterRewards.cycleToVoterToTotal(1, voter2)) +
          (await voterRewards.cycleToVoterToTotal(1, voter3)),
      ) // Total votes

      await waitForRoundToEnd(Number(roundId))

      // Votes should be the same after round ended
      appVotes = await xAllocationVoting.getAppVotes(roundId, app1)
      expect(appVotes).to.eql(ethers.parseEther("1700"))
      appVotes = await xAllocationVoting.getAppVotes(roundId, app2)
      expect(appVotes).to.eql(ethers.parseEther("600"))

      totalVotes = await xAllocationVoting.totalVotes(roundId)
      expect(totalVotes).to.eql(ethers.parseEther("2300"))

      await waitForNextCycle()

      expect(await emissions.isCycleDistributed(await emissions.nextCycle())).to.equal(false)
      expect(await emissions.isNextCycleDistributable()).to.equal(true)

      // Reward claiming
      expect(await emissions.isCycleDistributed(1)).to.equal(true)
      expect(await b3tr.balanceOf(await voterRewards.getAddress())).to.equal(await emissions.getVote2EarnAmount(1))

      const voter1Rewards = await voterRewards.getReward(1, voter1.address)
      const voter2Rewards = await voterRewards.getReward(1, voter2.address)
      const voter3Rewards = await voterRewards.getReward(1, voter3.address)

      await voterRewards.connect(voter1).claimReward(1, voter1)

      expect(await b3tr.balanceOf(voter1.address)).to.equal(voter1Rewards)

      expect(await b3tr.balanceOf(await voterRewards.getAddress())).to.equal(
        (await emissions.getVote2EarnAmount(1)) - voter1Rewards,
      )

      // Second round
      await emissions.connect(voter1).distribute() // Anyone can distribute the cycle

      const roundId2 = await xAllocationVoting.currentRoundId()

      expect(roundId2).to.equal(2)

      expect(await xAllocationVoting.roundDeadline(roundId)).to.lt(await emissions.getNextCycleBlock())

      // Vote on apps for the second round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 1 votes 1000 for app2
          [ethers.parseEther("100"), ethers.parseEther("500")], // Voter 2 votes 100 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        roundId2, // Second round
      )

      expect(await emissions.isCycleEnded(2)).to.equal(false)

      await catchRevert(voterRewards.claimReward(2, voter1.address))

      expect(await voterRewards.cycleToVoterToTotal(2, voter1)).to.equal(ethers.parseEther("31.622776601"))

      expect(await voterRewards.cycleToVoterToTotal(2, voter2)).to.equal(ethers.parseEther("24.494897427"))

      await catchRevert(voterRewards.claimReward(2, voter2.address))

      expect(await voterRewards.cycleToVoterToTotal(2, voter3)).to.equal(ethers.parseEther("31.622776601"))

      // Votes should be tracked correctly
      appVotes = await xAllocationVoting.getAppVotes(roundId2, app1)
      expect(appVotes).to.eql(ethers.parseEther("600"))
      appVotes = await xAllocationVoting.getAppVotes(roundId2, app2)
      expect(appVotes).to.eql(ethers.parseEther("2000"))

      totalVotes = await xAllocationVoting.totalVotes(roundId2)
      expect(totalVotes).to.eql(ethers.parseEther("2600"))

      // Total voters should be tracked correctly
      totalVoters = await xAllocationVoting.totalVoters(roundId2)
      expect(totalVoters).to.eql(BigInt(3))

      // Voter rewards checks
      expect(await voterRewards.cycleToTotal(2)).to.equal(ethers.parseEther("87.740450629")) // Total votes -> Math.sqrt(1000) + Math.sqrt(300) + Math.sqrt(1000)
      expect(await voterRewards.cycleToTotal(2)).to.equal(
        (await voterRewards.cycleToVoterToTotal(2, voter1)) +
          (await voterRewards.cycleToVoterToTotal(2, voter2)) +
          (await voterRewards.cycleToVoterToTotal(2, voter3)),
      ) // Total votes

      await waitForRoundToEnd(Number(roundId2))

      // Votes should be the same after round ended
      appVotes = await xAllocationVoting.getAppVotes(roundId2, app1)
      expect(appVotes).to.eql(ethers.parseEther("600"))
      appVotes = await xAllocationVoting.getAppVotes(roundId2, app2)
      expect(appVotes).to.eql(ethers.parseEther("2000"))

      totalVotes = await xAllocationVoting.totalVotes(roundId2)
      expect(totalVotes).to.eql(ethers.parseEther("2600"))

      await waitForNextCycle()

      expect(await emissions.isCycleEnded(2)).to.equal(true)

      expect(await emissions.isCycleDistributed(await emissions.nextCycle())).to.equal(false)
      expect(await emissions.isNextCycleDistributable()).to.equal(true)

      // Reward claiming
      expect(await emissions.isCycleDistributed(2)).to.equal(true)
      expect(await b3tr.balanceOf(await voterRewards.getAddress())).to.gt(await emissions.getVote2EarnAmount(2)) // Voters of round 1 can still claim rewards of round 1 thus the balance of VoterRewards contract should be greater than the emission amount

      const voter1Rewards2 = await voterRewards.getReward(2, voter1.address)
      const voter2Rewards2 = await voterRewards.getReward(2, voter2.address)
      const voter3Rewards2 = await voterRewards.getReward(2, voter3.address)

      await voterRewards.connect(voter1).claimReward(2, voter1)
      await voterRewards.connect(voter2).claimReward(2, voter2)
      await voterRewards.connect(voter3).claimReward(2, voter3)

      expect(await b3tr.balanceOf(voter1.address)).to.equal(voter1Rewards + voter1Rewards2) // Voter 1 claimed also rewards of round 1
      expect(await b3tr.balanceOf(voter2.address)).to.equal(voter2Rewards2)
      expect(await b3tr.balanceOf(voter3.address)).to.equal(voter3Rewards2)

      // Voters of round 1 can still claim rewards of round 1
      await voterRewards.connect(voter2).claimReward(1, voter2)
      await voterRewards.connect(voter3).claimReward(1, voter3)

      expect(await b3tr.balanceOf(voter2.address)).to.equal(voter2Rewards + voter2Rewards2)
      expect(await b3tr.balanceOf(voter3.address)).to.equal(voter3Rewards + voter3Rewards2)
    })

    it("Should increase voting rewards for user's with higher token levels", async () => {
      const config = createTestConfig()
      const {
        xAllocationVoting,
        otherAccounts,
        otherAccount: voter1,
        owner,
        voterRewards,
        emissions,
        b3tr,
        minterAccount,
        governor,
        treasury,
        x2EarnApps,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const galaxyMemberV1 = (await deployProxy("GalaxyMemberV1", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMemberV1",
        "GalaxyMember",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
      await voterRewards.setGalaxyMember(await galaxyMember.getAddress())

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[0])
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[1])
      const voter2 = otherAccounts[3]
      const voter3 = otherAccounts[4]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      const roundId = await xAllocationVoting.currentRoundId()

      expect(roundId).to.equal(1)

      expect(await xAllocationVoting.roundDeadline(roundId)).to.lt(await emissions.getNextCycleBlock())

      // Vote on apps for the first round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        roundId, // First round
      )

      // Rewards to be claimed are the same for all voters:
      expect(await voterRewards.getReward(1, voter1.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter2.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter3.address)).to.equal(666666666666666666666666n)

      await waitForRoundToEnd(Number(roundId))

      await waitForNextCycle()

      // GM NFT token mint and upgrade
      await galaxyMember.connect(voter1).freeMint()

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint()

      await upgradeNFTtoLevel(1, 5, galaxyMember, b3tr, voter1, minterAccount) // Upgrading to level 5

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter1.address))).to.equal(5)

      // Second round
      await emissions.connect(voter1).distribute() // Anyone can distribute the cycle

      await waitForNextBlock()

      const roundId2 = await xAllocationVoting.currentRoundId()

      expect(roundId2).to.equal(2)

      expect(await xAllocationVoting.roundDeadline(roundId2)).to.lt(await emissions.getNextCycleBlock())

      // Vote on apps for the second round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 1 votes 1000 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        roundId2, // Second round
      )

      // Rewards to be claimed are now NOT the same for all voters because voter1 has a higher level NFT:

      /*

      */
      expect(await voterRewards.getReward(2, voter1.address)).to.equal(1000000000000000000000000n) // Double voting rewards multiplier so it's like he voted 2000 (out of 4000 total votes) => 50% of the rewards
      expect(await voterRewards.getReward(2, voter2.address)).to.equal(500000000000000000000000n)
      expect(await voterRewards.getReward(2, voter3.address)).to.equal(500000000000000000000000n)
    })

    it("Should change voting rewards if user upgrades after x allocation round snapshot", async () => {
      const config = createTestConfig()
      const {
        xAllocationVoting,
        otherAccounts,
        otherAccount: voter1,
        owner,
        voterRewards,
        emissions,
        b3tr,
        minterAccount,
        governor,
        treasury,
        x2EarnApps,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const galaxyMemberV1 = (await deployProxy("GalaxyMemberV1", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMemberV1",
        "GalaxyMember",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
      await voterRewards.setGalaxyMember(await galaxyMember.getAddress())

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[0])
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[1])
      const voter2 = otherAccounts[3]
      const voter3 = otherAccounts[4]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      const roundId = await xAllocationVoting.currentRoundId()

      expect(roundId).to.equal(1)

      expect(await xAllocationVoting.roundDeadline(roundId)).to.lt(await emissions.getNextCycleBlock())

      // Vote on apps for the first round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        roundId, // First round
      )

      // Rewards to be claimed are the same for all voters:
      expect(await voterRewards.getReward(1, voter1.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter2.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter3.address)).to.equal(666666666666666666666666n)

      await waitForRoundToEnd(Number(roundId))

      await waitForNextCycle()

      // Second round
      await emissions.connect(voter1).distribute() // Anyone can distribute the cycle

      // GM NFT token mint and upgrade
      await galaxyMember.connect(voter1).freeMint()

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint()

      await upgradeNFTtoLevel(1, 2, galaxyMember, b3tr, voter1, minterAccount) // Upgrading to level 2

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter1.address))).to.equal(2)

      const roundId2 = await xAllocationVoting.currentRoundId()

      expect(roundId2).to.equal(2)

      expect(await xAllocationVoting.roundDeadline(roundId2)).to.lt(await emissions.getNextCycleBlock())

      // Vote on apps for the second round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 1 votes 1000 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        roundId2, // Second round
      )

      /*
        voter 1 = sqrt(1000) * 1.1 = 34.74842
        voter 2 = sqrt(1000) = 31.622
        voter 3 = sqrt(1000) = 31.622

        total = 34.74842 + 31.622 + 31.622 = 97.99242

        voter 1 = 34.74842 / 97.99242 * 100 = 35.42% = 2,000,000 * 35.42% = 708,333.
        voter 2 = 31.622 / 97.99242 * 100 = 32.31% = 2,000,000 * 32.31% = 646,153.
        voter 3 = 31.622 / 97.99242 * 100 = 32.31% = 2,000,000 * 32.31% = 646,153.
      */

      // Rewards to be claimed are now NOT the same for all voters because voter1 has a higher level NFT:
      expect(await voterRewards.getReward(2, voter1.address)).to.equal(709677419354838709677419n)
      expect(await voterRewards.getReward(2, voter2.address)).to.equal(645161290322580645161290n)
      expect(await voterRewards.getReward(2, voter3.address)).to.equal(645161290322580645161290n)
    })

    it("Should calculate rewards correctly if users have different levels of NFTs", async () => {
      const config = createTestConfig()
      const {
        xAllocationVoting,
        otherAccounts,
        otherAccount: voter1,
        owner,
        voterRewards,
        emissions,
        b3tr,
        minterAccount,
        governor,
        treasury,
        x2EarnApps,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      const galaxyMemberV1 = (await deployProxy("GalaxyMemberV1", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMemberV1",
        "GalaxyMember",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
      await voterRewards.setGalaxyMember(await galaxyMember.getAddress())

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[0])
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[1])
      const voter2 = otherAccounts[3]
      const voter3 = otherAccounts[4]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      const roundId = await xAllocationVoting.currentRoundId()

      expect(roundId).to.equal(1)

      expect(await xAllocationVoting.roundDeadline(roundId)).to.lt(await emissions.getNextCycleBlock())

      // Vote on apps for the first round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        roundId, // First round
      )

      // Rewards to be claimed are the same for all voters:
      expect(await voterRewards.getReward(1, voter1.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter2.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter3.address)).to.equal(666666666666666666666666n)

      await waitForRoundToEnd(Number(roundId))

      await waitForNextCycle()

      // GM NFT token mint and upgrade
      await galaxyMember.connect(voter1).freeMint()

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint()

      await upgradeNFTtoLevel(1, 5, galaxyMember, b3tr, voter1, minterAccount) // Upgrading to level 5

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter1.address))).to.equal(5)

      await galaxyMember.connect(voter2).freeMint()

      await upgradeNFTtoLevel(2, 10, galaxyMember, b3tr, voter2, minterAccount) // Upgrading to level 10

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter2.address))).to.equal(10)

      await galaxyMember.connect(voter3).freeMint()

      await upgradeNFTtoLevel(3, 2, galaxyMember, b3tr, voter3, minterAccount) // Upgrading to level 2

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter3.address))).to.equal(2)

      await emissions.connect(voter1).distribute() // Anyone can distribute the cycle

      const roundId2 = await xAllocationVoting.currentRoundId()

      expect(roundId2).to.equal(2)

      expect(await xAllocationVoting.roundDeadline(roundId2)).to.lt(await emissions.getNextCycleBlock())

      await waitForNextBlock()

      // Vote on apps for the second round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 1 votes 1000 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        roundId2, // Second round
      )

      /*
        voter 1 = 31.62 reward weighted votes * 100% multiplier = 63.24 reward weighted power
        voter 2 = 31.62 reward weighted votes * 25x multiplier = 790.57 reward weighted power
        voter 3 = 31.62 reward weighted votes * 10% multiplier = 34.78 reward weighted power

        Total power = 888.60
        voter 1 allocation = 63.24 / 888.60 * 100 = 7.11%
        voter 2 allocation = 790.57 / 888.60 * 100 = 88.96%
        voter 3 allocation = 34.78 / 888.60 * 100 = 3.91%
      */
      expect(await voterRewards.cycleToTotal(2)).to.equal(ethers.parseEther("888.6000224881")) // Total reward weighted votes
      expect(await voterRewards.cycleToVoterToTotal(2, voter1)).to.equal(ethers.parseEther("63.245553202")) // Voter 1 reward weighted votes
      expect(await voterRewards.cycleToVoterToTotal(2, voter2)).to.equal(ethers.parseEther("790.569415025")) // Voter 2 reward weighted votes
      expect(await voterRewards.cycleToVoterToTotal(2, voter3)).to.equal(ethers.parseEther("34.7850542611")) // Voter 3 reward weighted votes

      /*
        voter 1 = 31.62 reward weighted votes * 100% multiplier = 63.24 reward weighted power
        voter 2 = 31.62 reward weighted votes * 25x multiplier = 790.57 reward weighted power
        voter 3 = 31.62 reward weighted votes * 10% multiplier = 34.78 reward weighted power

        Total power = 888.60
        voter 1 allocation = 63.24 / 888.60 * 100 = 7.11%
        voter 2 allocation = 790.57 / 888.60 * 100 = 88.96%
        voter 3 allocation = 34.78 / 888.60 * 100 = 3.91%
      */
      expect(await voterRewards.getReward(2, voter1.address)).to.equal(142348754448398576512455n) // 7.11%
      expect(await voterRewards.getReward(2, voter2.address)).to.equal(1779359430604982206405693n) // 88.96%
      expect(await voterRewards.getReward(2, voter3.address)).to.equal(78291814946619217081850n) // 3.91%
    })

    it("Should change GM NFT Level if user transfers GM NFT", async () => {
      const config = createTestConfig()
      const {
        xAllocationVoting,
        otherAccounts,
        otherAccount: voter1,
        owner,
        voterRewards,
        emissions,
        b3tr,
        minterAccount,
        governor,
        treasury,
        x2EarnApps,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      const galaxyMemberV1 = (await deployProxy("GalaxyMemberV1", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMemberV1",
        "GalaxyMember",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
      await voterRewards.setGalaxyMember(await galaxyMember.getAddress())

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[0])
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[1])
      const voter2 = otherAccounts[3]
      const voter3 = otherAccounts[4]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      const roundId = await xAllocationVoting.currentRoundId()

      expect(roundId).to.equal(1)

      expect(await xAllocationVoting.roundDeadline(roundId)).to.lt(await emissions.getNextCycleBlock())

      // Vote on apps for the first round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        roundId, // First round
      )

      // Rewards to be claimed are the same for all voters:
      expect(await voterRewards.getReward(1, voter1.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter2.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter3.address)).to.equal(666666666666666666666666n)

      await waitForRoundToEnd(Number(roundId))

      await waitForNextCycle()

      // GM NFT token mint and upgrade
      await galaxyMember.connect(voter1).freeMint()

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint()

      await upgradeNFTtoLevel(1, 5, galaxyMember, b3tr, voter1, minterAccount) // Upgrading to level 5

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter1.address))).to.equal(5)

      await emissions.connect(voter1).distribute() // Anyone can distribute the cycle

      const roundId2 = await xAllocationVoting.currentRoundId()

      expect(roundId2).to.equal(2)

      expect(await xAllocationVoting.roundDeadline(roundId2)).to.lt(await emissions.getNextCycleBlock())

      await waitForNextBlock()

      // Transfer GM NFT to another account
      await galaxyMember.connect(voter1).transferFrom(voter1.address, voter2.address, 1)

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter2.address))).to.equal(5)

      // Vote on apps for the second round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 1 votes 1000 for app2 -> 31.62 reward weighted votes
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 2 votes 1000 for app2 -> 31.62 reward weighted votes
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2 -> 31.62 reward weighted votes
        ],
        roundId2, // Second round
      )

      // Rewards to be claimed are now NOT the same for all voters because voters have different levels of NFTs:
      expect(await voterRewards.getReward(2, voter1.address)).to.equal(500000000000000000000000n) // Even if voter1 transferred the NFT, at the time of the round snapshot he had a level 5 NFT (thus he should get the rewards of a level 5 NFT)
      expect(await voterRewards.getReward(2, voter2.address)).to.equal(1000000000000000000000000n)
      expect(await voterRewards.getReward(2, voter3.address)).to.equal(500000000000000000000000n)
    })

    it("Should be able to use GM NFT received from transfer to increase voting rewards", async () => {
      const config = createTestConfig()
      const {
        xAllocationVoting,
        otherAccounts,
        otherAccount: voter1,
        owner,
        voterRewards,
        emissions,
        b3tr,
        minterAccount,
        governor,
        treasury,
        x2EarnApps,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      const galaxyMemberV1 = (await deployProxy("GalaxyMemberV1", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMemberV1",
        "GalaxyMember",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
      await voterRewards.setGalaxyMember(await galaxyMember.getAddress())

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[0])
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[1])

      const voter2 = otherAccounts[3]
      const voter3 = otherAccounts[4]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      const roundId = await xAllocationVoting.currentRoundId()

      expect(roundId).to.equal(1)

      expect(await xAllocationVoting.roundDeadline(roundId)).to.lt(await emissions.getNextCycleBlock())

      // Vote on apps for the first round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1 -> 31.62 reward weighted votes
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2 -> 31.62 reward weighted votes
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2 -> 31.62 reward weighted votes
        ],
        roundId, // First round
      )

      // Rewards to be claimed are the same for all voters:
      expect(await voterRewards.getReward(1, voter1.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter2.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(1, voter3.address)).to.equal(666666666666666666666666n)

      await waitForRoundToEnd(Number(roundId))

      await waitForNextCycle()

      // GM NFT token mint and upgrade
      await galaxyMember.connect(voter1).freeMint()

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint()

      await upgradeNFTtoLevel(1, 5, galaxyMember, b3tr, voter1, minterAccount) // Upgrading to level 5

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter1.address))).to.equal(5)

      // Send GM NFT to another account
      await galaxyMember.connect(voter1).transferFrom(voter1.address, voter2.address, 1)

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter2.address))).to.equal(5)

      await emissions.connect(voter1).distribute() // Anyone can distribute the cycle

      const roundId2 = await xAllocationVoting.currentRoundId()

      expect(roundId2).to.equal(2)

      expect(await xAllocationVoting.roundDeadline(roundId2)).to.lt(await emissions.getNextCycleBlock())

      await waitForNextBlock()

      // Vote on apps for the second round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 1 votes 1000 for app2 -> 31.62 reward weighted votes
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 2 votes 1000 for app2 -> 31.62 reward weighted votes
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2 -> 31.62 reward weighted votes
        ],
        roundId2, // Second round
      )

      // Rewards to be claimed are now NOT the same for all voters because voters have different levels of NFTs:
      expect(await voterRewards.getReward(2, voter1.address)).to.equal(500000000000000000000000n)
      expect(await voterRewards.getReward(2, voter2.address)).to.equal(1000000000000000000000000n) // Voter 2 has the NFT transferred from voter 1 of level 5 before the round snapshot
      expect(await voterRewards.getReward(2, voter3.address)).to.equal(500000000000000000000000n)
    })

    it("Should not be able to claim rewards if not voted", async () => {
      const { xAllocationVoting, otherAccount, voterRewards, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      let roundId = await xAllocationVoting.currentRoundId()

      await waitForRoundToEnd(Number(roundId))

      await waitForNextCycle()

      await catchRevert(voterRewards.claimReward(1, otherAccount.address)) // Should not be able to claim rewards as not voted

      await emissions.connect(otherAccount).distribute()

      roundId = await xAllocationVoting.currentRoundId()

      await waitForRoundToEnd(Number(roundId))

      await waitForNextCycle()

      await emissions.connect(otherAccount).distribute()

      await expect(voterRewards.claimReward(1, otherAccount.address)).to.be.reverted
      await expect(voterRewards.claimReward(2, otherAccount.address)).to.be.reverted
    })

    it("Should not be able to claim rewards twice", async () => {
      const { xAllocationVoting, otherAccount, voterRewards, emissions, b3tr, owner, minterAccount, otherAccounts } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      const [app1] = await addAppsToAllocationVoting([otherAccount.address], owner)

      const voter1 = otherAccounts[0]

      await getVot3Tokens(voter1, "1000")

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      const roundId = await xAllocationVoting.currentRoundId()

      await voteOnApps([app1], [voter1], [[ethers.parseEther("1000")]], roundId)

      await waitForRoundToEnd(Number(roundId))

      await waitForNextCycle()

      await voterRewards.connect(voter1).claimReward(1, voter1.address)

      expect(await b3tr.balanceOf(voter1.address)).to.equal(await emissions.getVote2EarnAmount(1)) //  voter thus all rewards

      await catchRevert(voterRewards.claimReward(1, otherAccount.address)) // Should not be able to claim rewards twice
    })

    it("Should revert if vote is registered by non vote registrar", async () => {
      const { voterRewards, otherAccount, xAllocationVoting, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      const roundId = await xAllocationVoting.currentRoundId()

      const proposalStart = await xAllocationVoting.roundSnapshot(roundId)

      await expect(
        voterRewards
          .connect(otherAccount)
          .registerVote(
            proposalStart,
            otherAccount.address,
            ethers.parseEther("1000"),
            ethers.parseEther("31.6227766017"),
          ),
      ).to.be.reverted
    })

    it("Should not be able to claim rewards for cycle zero", async () => {
      const { voterRewards, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(voterRewards.claimReward(0, otherAccount.address)).to.be.reverted // Cycle zero is a non-existing cycle, first cycle when emissions start is 1
    })

    it("Should not register any vote if voting power is zero", async () => {
      const { voterRewards, otherAccount, owner, emissions, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await voterRewards.connect(owner).grantRole(await voterRewards.VOTE_REGISTRAR_ROLE(), otherAccount.address)

      await bootstrapEmissions()

      await emissions.connect(minterAccount).start()

      const totalVotesBefore = await voterRewards.cycleToTotal(1)

      await voterRewards
        .connect(otherAccount)
        .registerVote(1, otherAccount.address, ethers.parseEther("0"), ethers.parseEther("0"))

      const totalVotesAfter = await voterRewards.cycleToTotal(1)

      expect(totalVotesBefore).to.equal(totalVotesAfter) // We expect no votes to be registered when voting power is zero
    })
  })

  describe("Governance voting rewards", () => {
    const description = "Test Proposal: testing propsal with random description!"
    const functionToCall = "tokenDetails"

    it("Should calculate rewards correctly for governance voting", async () => {
      const config = createLocalConfig()
      const { otherAccounts, b3tr, B3trContract, voterRewards } = await getOrDeployContractInstances({
        config: {
          ...config,
          EMISSIONS_CYCLE_DURATION: 200,
          B3TR_GOVERNOR_DEPOSIT_THRESHOLD: 0,
        },
        forceDeploy: true,
      })

      const governorV2 = await upgradeGovernanceToV2()

      const voter1 = otherAccounts[0]
      const voter2 = otherAccounts[1]
      const proposar = otherAccounts[2]

      // we do it here but will use in the next test
      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(proposar, "1000")

      // Now we can create a new proposal
      const tx = await createProposal(b3tr, B3trContract, proposar, description, functionToCall, [])
      const proposalId = await getProposalIdFromTx(tx)

      const cycle = await governorV2.proposalStartRound(proposalId)

      const proposalState = await waitForProposalToBeActive(proposalId)

      expect(proposalState).to.equal("1") // Active

      // Vote on the proposal
      await governorV2.connect(voter1).castVote(proposalId, 1) // For
      await governorV2.connect(voter2).castVote(proposalId, 1) // For

      await waitForNextCycle()

      expect(await voterRewards.getReward(cycle, voter1.address)).to.equal(1000000000000000000000000n) // 50% of the rewards
      expect(await voterRewards.getReward(cycle, voter2.address)).to.equal(1000000000000000000000000n) // 50% of the rewards

      expect(await voterRewards.cycleToTotal(cycle)).to.equal(ethers.parseEther("63.245553202")) // Total reward weighted votes
    })

    it("Should be able to vote with 0 VOT3 tokens and not receive rewards", async () => {
      const config = createLocalConfig()
      config.B3TR_GOVERNOR_VOTING_THRESHOLD = ethers.parseEther("0")
      config.INITIAL_X_ALLOCATION = BigInt("66666666666666666666666")

      const { otherAccounts, b3tr, B3trContract, voterRewards } = await getOrDeployContractInstances({
        forceDeploy: true,
        config: {
          ...config,
          EMISSIONS_CYCLE_DURATION: 200,
          B3TR_GOVERNOR_DEPOSIT_THRESHOLD: 0,
        },
      })

      const governorV2 = await upgradeGovernanceToV2()

      const voter1 = otherAccounts[0]
      const voter2 = otherAccounts[1]

      await getVot3Tokens(voter1, "1000")

      // Now we can create a new proposal
      const tx = await createProposal(b3tr, B3trContract, voter1, description, functionToCall, [])
      const proposalId = await getProposalIdFromTx(tx)

      const cycle = await governorV2.proposalStartRound(proposalId)

      const proposalState = await waitForProposalToBeActive(proposalId)

      expect(proposalState).to.equal("1") // Active

      // Vote on the proposal
      await governorV2.connect(voter1).castVote(proposalId, 1) // For
      await governorV2.connect(voter2).castVote(proposalId, 1) // For

      await waitForNextCycle()

      expect(await voterRewards.getReward(cycle, voter1.address)).to.equal(66666666666666666666666n) // 100% of the rewards
      expect(await voterRewards.getReward(cycle, voter2.address)).to.equal(0) // Even if voter2 voted, he has 0 VOT3 tokens so he should not receive any rewards
    })

    it("Should be able to increase voting rewards by upgrading GM NFT", async () => {
      const config = createLocalConfig()
      const {
        otherAccounts,
        b3tr,
        B3trContract,
        emissions,
        minterAccount,
        owner,
        voterRewards,
        treasury,
        xAllocationVoting,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
        config: {
          ...config,
          EMISSIONS_CYCLE_DURATION: 200,
          B3TR_GOVERNOR_DEPOSIT_THRESHOLD: 0,
        },
      })

      const governorV2 = await upgradeGovernanceToV2()

      const galaxyMemberV1 = (await deployProxy("GalaxyMemberV1", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMemberV1",
        "GalaxyMember",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governorV2.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
      await voterRewards.setGalaxyMember(await galaxyMember.getAddress())

      const voter1 = otherAccounts[0]
      const voter2 = otherAccounts[1]
      const proposar = otherAccounts[2]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(proposar, "2000")

      // Now we can create a new proposal
      let tx = await createProposal(b3tr, B3trContract, proposar, description, functionToCall, [])
      let proposalId = await getProposalIdFromTx(tx)

      let cycle = await governorV2.proposalStartRound(proposalId)

      const proposalState = await waitForProposalToBeActive(proposalId)

      expect(proposalState).to.equal("1") // Active

      // Vote on the proposal
      await governorV2.connect(voter1).castVote(proposalId, 1) // For
      await governorV2.connect(voter2).castVote(proposalId, 1) // For

      await waitForNextCycle()

      expect(await voterRewards.getReward(cycle, voter1.address)).to.equal(1000000000000000000000000n) // 50% of the rewards
      expect(await voterRewards.getReward(cycle, voter2.address)).to.equal(1000000000000000000000000n) // 50% of the rewards

      await emissions.connect(voter1).distribute() // Anyone can distribute the cycle

      // GM NFT token mint and upgrade
      await galaxyMember.connect(voter1).freeMint()

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint()

      await upgradeNFTtoLevel(1, 5, galaxyMember, b3tr, voter1, minterAccount) // Upgrading to level 5

      tx = await createProposal(b3tr, B3trContract, proposar, description + "1", functionToCall, [])
      proposalId = await getProposalIdFromTx(tx)
      cycle = await governorV2.proposalStartRound(proposalId)

      await waitForProposalToBeActive(proposalId)

      await governorV2.connect(voter1).castVote(proposalId, 1) // For
      await governorV2.connect(voter2).castVote(proposalId, 1) // For

      await waitForNextCycle()

      /*
        voter1 = 1000 votes (31.62 reward weighted votes) for governance voting * 100% multiplier = 63.24 reward weighted power
        voter2 = 1000 votes (31.62 reward weighted votes) for governance voting without NFT upgrade = 31.62 reward weighted power

        Total power = 94.86
        voter1 allocation = 63.24 / 94.86 * 100 = 66.67%
        voter2 allocation = 31.62 / 94.86 * 100 = 33.33%
      */
      expect(await voterRewards.getReward(cycle, voter1.address)).to.equal(1333333333333333333333333n)
      expect(await voterRewards.getReward(cycle, voter2.address)).to.equal(666666666666666666666666n)
    })
  })

  describe("X allocation & governance voting rewards", () => {
    const description = "Test Proposal: testing propsal with random description!"
    const functionToCall = "tokenDetails"

    it("Should calculate rewards correctly for governance voting and x allocation voting", async () => {
      const config = createLocalConfig()
      const {
        otherAccounts,
        b3tr,
        B3trContract,
        emissions,
        minterAccount,
        owner,
        voterRewards,
        xAllocationVoting,
        treasury,
        x2EarnApps,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
        config: {
          ...config,
          EMISSIONS_CYCLE_DURATION: 200,
          B3TR_GOVERNOR_DEPOSIT_THRESHOLD: 0,
        },
      })

      const governorV2 = await upgradeGovernanceToV2()

      const galaxyMemberV1 = (await deployProxy("GalaxyMemberV1", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMemberV1",
        "GalaxyMember",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governorV2.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
      await voterRewards.setGalaxyMember(await galaxyMember.getAddress())

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[0])
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")
      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[1])

      const voter1 = otherAccounts[0]
      const voter2 = otherAccounts[1]
      const voter3 = otherAccounts[2]
      const proposar = otherAccounts[3]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")
      await getVot3Tokens(proposar, "2000")

      await waitForNextCycle()

      await emissions.distribute()

      let nextCycle = await emissions.nextCycle()

      // Now we can create a new proposal
      let tx = await createProposal(b3tr, B3trContract, proposar, description, functionToCall, [], nextCycle)
      let proposalId = await getProposalIdFromTx(tx)

      const proposalState = await waitForProposalToBeActive(proposalId) // we are now in round 2
      let xAllocationsRoundID = await xAllocationVoting.currentRoundId()

      expect(xAllocationsRoundID).to.equal(nextCycle)
      expect(proposalState).to.equal("1") // Active

      // Vote on the proposal (voter3 does not vote)
      await governorV2.connect(voter1).castVote(proposalId, 1) // For
      await governorV2.connect(voter2).castVote(proposalId, 1) // For

      expect(await xAllocationVoting.roundDeadline(xAllocationsRoundID)).to.lt(await emissions.getNextCycleBlock())

      // Upgrading GM NFT
      await galaxyMember.connect(voter1).freeMint()

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint()

      await upgradeNFTtoLevel(1, 5, galaxyMember, b3tr, voter1, minterAccount) // Upgrading to level 5

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(voter1.address))).to.equal(5)

      // Vote on apps for the second round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        xAllocationsRoundID, // second round
      )

      /*
        voter1 = 1000 votes (reward weighted votes 31.26) for governance voting and 1000 votes * 2.5 = 31.26 + 31.26 * 2 = 93.78
        voter2 = 1000 votes (reward weighted votes 31.26) for governance voting and 1000 votes (reward weighted votes 31.26) for x allocation voting = 2000 votes (reward weighted votes 63.24)
        voter3 = 0 votes for governance voting and 1000 votes (reward weighted votes 31.26) for x allocation voting = 1000 votes (reward weighted votes 31.26)

        Total reward weighted votes = 93.78 + 63.24 + 31.26 = 188.28
        voter1 allocation = 93.78 / 188.28 * 100 = 50% (1000000 B3TR)
        voter2 allocation = 63.24 / 188.28 * 100 = 33.57% (670000 B3TR)
        voter3 allocation = 31.26 / 188.28 * 100 = 16.43% (330000 B3TR)
      */

      expect(await voterRewards.getReward(xAllocationsRoundID, voter1.address)).to.equal(1000000000000000000000000n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter2.address)).to.equal(666666666666666666666666n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter3.address)).to.equal(333333333333333333333333n)

      nextCycle = await emissions.nextCycle() // next cycle round 3

      // Now we can create a new proposal and the GM NFT upgrade will be taken into account
      tx = await createProposal(b3tr, B3trContract, proposar, description + "1", functionToCall, [], nextCycle)
      proposalId = await getProposalIdFromTx(tx)

      await waitForProposalToBeActive(proposalId) // we are in round 3 now

      // Vote on the proposal
      await governorV2.connect(voter1).castVote(proposalId, 1) // For
      await governorV2.connect(voter2).castVote(proposalId, 1) // For

      xAllocationsRoundID = await xAllocationVoting.currentRoundId()
      // Vote on apps for the second round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        xAllocationsRoundID, // second round
      )

      /*
        voter 1 = 31.26 * 2 + 31.26 * 2 = 125.04 reward weighted votes
        voter 2 = 31.26 + 31.26 * 2 = 62.52 reward weighted votes
        voter 3 = 31.26 

        Total reward weighted votes = 218.82

        voter 1 allocation = 125.04 / 218.82 * 100 = 57.14% = 2,000,000 * 57.14% = 1,142,800
        voter 2 allocation = 62.52 / 218.82 * 100 = 28.57% = 2,000,000 * 28.57% = 571,400
        voter 3 allocation = 31.26 / 218.82 * 100 = 14.28% = 2,000,000 * 14.28% = 285,700
      */
      expect(await voterRewards.getReward(xAllocationsRoundID, voter1.address)).to.equal(1142857142857142857142857n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter2.address)).to.equal(571428571428571428571428n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter3.address)).to.equal(285714285714285714285714n)
    })
  })

  describe("GM NFT Binding with Vechain nodes", () => {
    it("Should not multiply voting power if GM NFT already voted for proposal", async () => {
      const description = "Test Proposal: testing propsal with random description!"
      const functionToCall = "tokenDetails"

      const config = createLocalConfig()

      const {
        vechainNodesMock,
        galaxyMember,
        emissions,
        b3tr,
        B3trContract,
        xAllocationVoting,
        otherAccounts,
        voterRewards,
        x2EarnApps,
        owner,
      } = await getOrDeployContractInstances({
        config: {
          ...config,
          EMISSIONS_CYCLE_DURATION: 200,
          B3TR_GOVERNOR_DEPOSIT_THRESHOLD: 0,
        },
        forceDeploy: true,
        deployMocks: true,
      })

      const governorV2 = await upgradeGovernanceToV2()

      ///////////////////////////

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[8])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")

      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[7])

      const voter1 = otherAccounts[1]
      const voter2 = otherAccounts[2]
      const voter3 = otherAccounts[3]

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      await addNodeToken(1, voter1)
      await addNodeToken(3, voter3)

      await participateInAllocationVoting(voter1)

      await galaxyMember.connect(voter1).freeMint() // Token Id 0

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint() // Token Id 1

      await galaxyMember.setMaxLevel(10)

      // Attach node to GM NFT
      await galaxyMember.connect(voter1).attachNode(3, 1)

      expect(await galaxyMember.levelOf(1)).to.equal(2) // Level 1

      let nextCycle = await emissions.nextCycle() // next cycle round 2

      await getVot3Tokens(voter1, "999")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      // Now we can create a new proposal
      let tx = await createProposal(b3tr, B3trContract, voter1, description, functionToCall, [], nextCycle)
      let proposalId = await getProposalIdFromTx(tx)

      const proposalState = await waitForProposalToBeActive(proposalId) // we are now in round 2
      let xAllocationsRoundID = await xAllocationVoting.currentRoundId()

      expect(xAllocationsRoundID).to.equal(nextCycle)
      expect(proposalState).to.equal("1") // Active

      expect(await governorV2.getVotes(voter1.address, (await ethers.provider.getBlockNumber()) - 1)).to.equal(
        ethers.parseEther("1000"),
      )
      expect(await governorV2.getVotes(voter2.address, (await ethers.provider.getBlockNumber()) - 1)).to.equal(
        ethers.parseEther("1000"),
      )

      // Vote on the proposal (voter3 does not vote)
      await governorV2.connect(voter1).castVote(proposalId, 1) // For (sqrt(1000) = 31.62 weighted voting power * 10% multiplier = 34.78 weighted voting power)
      await governorV2.connect(voter2).castVote(proposalId, 1) // For (sqrt(1000) = 31.62 weighted voting power (No multiplier)

      /*
          voter1 has 52.37% of the voting power (34.78 / 66.4 * 100)
          voter2 has 47.62% of the voting power (31.62 / 66.4 * 100)

          voter 1 reward is 52.37% of the rewards = 2,000,000 * 52.37% = 1,047,400
          voter 2 reward is 47.62% of the rewards = 2,000,000 * 47.62% = 952,600
      */
      expect(await voterRewards.getReward(await xAllocationVoting.currentRoundId(), voter1.address)).to.equal(
        1047619047619047619047619n,
      )
      expect(await voterRewards.getReward(await xAllocationVoting.currentRoundId(), voter2.address)).to.equal(
        952380952380952380952380n,
      )

      // Now we transfer the NFT to another account and vote with that account

      await expect(galaxyMember.connect(voter1).transferFrom(voter1.address, voter3.address, 1)).to.be.revertedWith(
        "GalaxyMember: token attached to a node, detach before transfer",
      ) // Can't transfer GM NFT attached to a node

      await galaxyMember.connect(voter1).detachNode(3, 1) // Detach node

      await galaxyMember.connect(voter1).transferFrom(voter1.address, voter3.address, 1) // Now we can transfer the NFT

      await galaxyMember.connect(voter3).attachNode(4, 1) // Attach Mjolnir to GM NFT of voter3 that he just received

      expect(await galaxyMember.levelOf(1)).to.equal(6) // Level 6 because of the Mjolnir node

      await governorV2.connect(voter3).castVote(proposalId, 1)

      /*
        voter3 cast vote but the GM NFT was already used to vote for the proposal, thus NO multiplier should be applied

        voter 3 voting power = 31.62
        voter 1 voting power = 34.78 (multiplier applied because he voted before with the GM NFT Level 2)
        voter 2 voting power = 31.62

        Total voting power = 98.02
        voter 3 allocation = 31.62 / 98.02 * 100 = 32.27% => 2,000,000 * 32.27% = 645,400
        voter 1 allocation = 34.78 / 98.02 * 100 = 35.50% => 2,000,000 * 35.50% = 710,000
        voter 2 allocation = 31.62 / 98.02 * 100 = 32.27% => 2,000,000 * 32.27% = 645,400
      */

      expect(await voterRewards.getReward(await xAllocationVoting.currentRoundId(), voter3.address)).to.equal(
        645161290322580645161290n,
      )
      expect(await voterRewards.getReward(await xAllocationVoting.currentRoundId(), voter1.address)).to.equal(
        709677419354838709677419n,
      )
      expect(await voterRewards.getReward(await xAllocationVoting.currentRoundId(), voter2.address)).to.equal(
        645161290322580645161290n,
      )

      expect(await emissions.getCurrentCycle()).to.equal(4) // We're in round 4
      expect(await emissions.isCycleEnded(await emissions.getCurrentCycle())).to.equal(false)

      // Vote on apps for the second round
      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 2 votes 500 for app1 and 500 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        xAllocationsRoundID,
      )

      /*
        Now with x allocation voting, things change a bit 

        voter 3: total weighted votes = 31.62 + (31.62 * 1.5 because of Level 5 GM NFT due to Mjolnir attached) = 31.62 + 79.05 = 110.67 total weighted votes
        voter 1: total weighted votes = 34.78 + 31.62 = 66.4 total weighted votes
        voter 2: total weighted votes = 31.62 + 31.62 = 63.24 total weighted votes

        Total weighted votes = 110.67 + 66.4 + 63.24 = 240.31

        voter 3 allocation = 110.67 / 240.31 * 100 = 46% => 2,000,000 * 46% = 920,000
        voter 1 allocation = 66.4 / 240.31 * 100 = 27.6% => 2,000,000 * 27.6% = 552,000
        voter 2 allocation = 63.24 / 240.31 * 100 = 26.3% => 2,000,000 * 26.3% = 526,000
      */

      expect(await voterRewards.getReward(await xAllocationVoting.currentRoundId(), voter3.address)).to.equal(
        921052631578947368421052n,
      )
      expect(await voterRewards.getReward(await xAllocationVoting.currentRoundId(), voter1.address)).to.equal(
        552631578947368421052631n,
      )
      expect(await voterRewards.getReward(await xAllocationVoting.currentRoundId(), voter2.address)).to.equal(
        526315789473684210526315n,
      )
    })

    it("Should not multiply voting power if Vechain node already voted for proposal", async () => {
      const description = "Test Proposal: testing propsal with random description!"
      const functionToCall = "tokenDetails"

      const config = createLocalConfig()

      const {
        vechainNodesMock,
        galaxyMember,
        emissions,
        b3tr,
        B3trContract,
        xAllocationVoting,
        otherAccounts,
        voterRewards,
        x2EarnApps,
        owner,
      } = await getOrDeployContractInstances({
        config: {
          ...config,
          EMISSIONS_CYCLE_DURATION: 200,
          B3TR_GOVERNOR_DEPOSIT_THRESHOLD: 0,
        },
        forceDeploy: true,
        deployMocks: true,
      })

      const governorV2 = await upgradeGovernanceToV2()

      ///////////////////////////

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[5])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")

      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[6])

      const voter1 = otherAccounts[1]
      const voter2 = otherAccounts[2]
      const voter3 = otherAccounts[3]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      await addNodeToken(3, voter1)

      const roundId = await startNewAllocationRound()

      await voteOnApps(
        [app1, app2],
        [voter1, voter2],
        [
          [ethers.parseEther("1"), ethers.parseEther("0")], // Voter 1 votes
          [ethers.parseEther("0"), ethers.parseEther("1")], // Voter 2 votes
        ],
        BigInt(roundId),
      )

      await galaxyMember.connect(voter1).freeMint() // Token Id 0

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint() // Token Id 1

      await galaxyMember.setMaxLevel(10)

      await waitForRoundToEnd(roundId)

      // Start next cycle
      await emissions.distribute()

      // Attach node to GM NFT
      await galaxyMember.connect(voter1).attachNode(3, 1)

      expect(await galaxyMember.levelOf(1)).to.equal(6) // Level 6 because of the Mjolnir node attached

      let xAllocationsRoundID = await xAllocationVoting.currentRoundId()

      // voter 2 doesn't vote
      await voteOnApps(
        [app1, app2],
        [voter1, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        xAllocationsRoundID,
      )

      /*
        voter 1: total weighted votes = sqrt(1000) * 2.5 (Mjolnir attached) = 31.62 * 2.5 = 79.05
        voter 3: total weighted votes = sqrt(1000) = 31.62

        Total weighted votes = 110.67

        voter 1 allocation = 79.05 / 110.67 * 100 = 71.42% => 2,000,000 * 71.42% = 1,428,400
        voter 3 allocation = 31.62 / 110.67 * 100 = 28.57% => 2,000,000 * 28.57% = 571,600
      */
      expect(await voterRewards.getReward(xAllocationsRoundID, voter1.address)).to.equal(1428571428571428571428571n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter2.address)).to.equal(0n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter3.address)).to.equal(571428571428571428571428n)

      // Skip ahead 1 day to be able to transfer node
      await time.setNextBlockTimestamp((await time.latest()) + 86400)

      // Transfer Mjolnir to voter2
      await vechainNodesMock.connect(voter1).transferFrom(voter1.address, voter2.address, 3)

      await galaxyMember.connect(voter2).freeMint() // Token Id 2

      await expect(galaxyMember.connect(voter2).attachNode(3, 2)).to.be.reverted // Mjolnir (token Id 1) is still attached to voter1

      await galaxyMember.connect(voter2).detachNode(3, await galaxyMember.getIdAttachedToNode(3)) // Detach Mjolnir from voter1's GM NFT

      await galaxyMember.connect(voter2).attachNode(3, 2) // Attach Mjolnir to voter2's GM NFT

      expect(await galaxyMember.levelOf(2)).to.equal(6) // Level 6 because of the Mjolnir node attached
      expect(await galaxyMember.levelOf(1)).to.equal(1) // Level 1 because Mjolnir was detached

      // Now voter 2 votes
      await voteOnApps(
        [app1, app2],
        [voter2],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 2 votes 1000 for app1
        ],
        xAllocationsRoundID,
      )

      /*
        voter 2 now voted:

        voter 2: total weighted votes = sqrt(1000) = 31.62 (NO multiplier even though he has level 6 GM NFT with Mjolnir attached, because that node already voted for this proposal)
        voter 1: total weighted votes = sqrt(1000) * 2.5 (Mjolnir attached previosuly) = 31.62 * 2.5 = 79.05
        voter 3: total weighted votes = sqrt(1000) = 31.62

        Total weighted votes = 142.29

        voter 2 allocation = 31.62 / 142.29 * 100 = 22.22% => 2,000,000 * 22.22% = 444,400
        voter 1 allocation = 79.05 / 142.29 * 100 = 55.56% => 2,000,000 * 55.56% = 1,111,200
        voter 3 allocation = 31.62 / 142.29 * 100 = 22.22% => 2,000,000 * 22.22% = 444,400
      */
      expect(await voterRewards.getReward(xAllocationsRoundID, voter2.address)).to.equal(444444444444444444444444n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter1.address)).to.equal(1111111111111111111111111n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter3.address)).to.equal(444444444444444444444444n)

      // Now we can create a new proposal
      let tx = await createProposal(
        b3tr,
        B3trContract,
        voter1,
        description,
        functionToCall,
        [],
        xAllocationsRoundID + BigInt(2),
      )
      let proposalId = await getProposalIdFromTx(tx)

      const proposalState = await waitForProposalToBeActive(proposalId)

      expect(proposalState).to.equal("1") // Active

      xAllocationsRoundID = await xAllocationVoting.currentRoundId()

      await governorV2.connect(voter1).castVote(proposalId, 1) // For
      await governorV2.connect(voter2).castVote(proposalId, 1) // For
      await governorV2.connect(voter3).castVote(proposalId, 0) // Against

      /*
        Now the proposal ID is completely different so multiplier should be applied

        voter 1: total weighted votes = sqrt(1000) = 31.62 (NO multiplier as Mjonir was detached)
        voter 2: total weighted votes = sqrt(1000) * 2.5 = 31.62 * 2.5 = 79.05 (Mjolnir attached)
        voter 3: total weighted votes = sqrt(1000) = 31.62

        Total weighted votes = 142.29

        voter 2 allocation = 31.62 / 142.29 * 100 = 22.22% => 2,000,000 * 22.22% = 1,111,200
        voter 1 allocation = 79.05 / 142.29 * 100 = 55.56% => 2,000,000 * 55.56% = 444,400
        voter 3 allocation = 31.62 / 142.29 * 100 = 22.22% => 2,000,000 * 22.22% = 444,400
      */
      expect(await voterRewards.getReward(xAllocationsRoundID, voter2.address)).to.equal(1111111111111111111111111n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter1.address)).to.equal(444444444444444444444444n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter3.address)).to.equal(444444444444444444444444n)
    })

    it("Should correctly track multiplier of GM NFT with B3TR donated when voting", async () => {
      const config = createLocalConfig()

      const {
        vechainNodesMock,
        galaxyMember,
        emissions,
        b3tr,
        minterAccount,
        xAllocationVoting,
        otherAccounts,
        voterRewards,
        x2EarnApps,
        owner,
      } = await getOrDeployContractInstances({
        config: {
          ...config,
          EMISSIONS_CYCLE_DURATION: 200,
          B3TR_GOVERNOR_DEPOSIT_THRESHOLD: 0,
        },
        forceDeploy: true,
        deployMocks: true,
      })

      ///////////////////////////

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const app1 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(app1, otherAccounts[6])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")

      const app2 = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
      await endorseApp(app2, otherAccounts[7])

      const voter1 = otherAccounts[1]
      const voter2 = otherAccounts[2]
      const voter3 = otherAccounts[3]

      await getVot3Tokens(voter1, "1000")
      await getVot3Tokens(voter2, "1000")
      await getVot3Tokens(voter3, "1000")

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      await addNodeToken(3, voter1)

      const roundId = await startNewAllocationRound()

      await voteOnApps(
        [app1, app2],
        [voter1, voter2],
        [
          [ethers.parseEther("1"), ethers.parseEther("0")], // Voter 1 votes
          [ethers.parseEther("0"), ethers.parseEther("1")], // Voter 2 votes
        ],
        BigInt(roundId),
      )

      await galaxyMember.connect(voter1).freeMint() // Token Id 0

      await galaxyMember.connect(voter1).burn(0)

      await galaxyMember.connect(voter1).freeMint() // Token Id 1

      await galaxyMember.setMaxLevel(3) // Set max level of GM NFT to 3

      await waitForRoundToEnd(roundId)

      // Start next cycle
      await emissions.distribute()

      // Attach node to GM NFT
      await galaxyMember.connect(voter1).attachNode(3, 1)

      expect(await galaxyMember.levelOf(1)).to.equal(3) // Level 3 because of the Mjolnir node attached but max level is 3.

      let xAllocationsRoundID = await xAllocationVoting.currentRoundId()

      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 2 votes 1000 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        xAllocationsRoundID,
      )

      /*
        voter 1: total weighted votes = sqrt(1000) * 1.20 (Level 3) = 31.62 * 1.20 = 37.94
        voter 2: total weighted votes = sqrt(1000) = 31.62
        voter 3: total weighted votes = sqrt(1000) = 31.62

        Total weighted votes = 101.18

        voter 1 allocation = 37.94 / 101.18 * 100 = 37.50% => 2,000,000 * 37.50% = 750,000
        voter 2 allocation = 31.62 / 101.18 * 100 = 31.25% => 2,000,000 * 31.25% = 625,000
        voter 3 allocation = 31.62 / 101.18 * 100 = 31.25% => 2,000,000 * 31.25% = 625,000
      */
      expect(await voterRewards.getReward(xAllocationsRoundID, voter1.address)).to.equal(750000000000000000000000n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter2.address)).to.equal(625000000000000000000000n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter3.address)).to.equal(625000000000000000000000n)

      await waitForRoundToEnd(xAllocationsRoundID)

      await galaxyMember.setMaxLevel(10) // Now set max level to 10

      // Start next cycle
      await emissions.distribute()

      xAllocationsRoundID = await xAllocationVoting.currentRoundId()

      expect(await galaxyMember.levelOf(1)).to.equal(6) // Level 6 because of the Mjolnir node attached which allows the GM NFT to be level 6 for free

      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 2 votes 1000 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        xAllocationsRoundID,
      )

      /*
        voter 1: total weighted votes = sqrt(1000) * 2.5 (Level 6) = 31.62 * 2.5 = 79.05
        voter 2: total weighted votes = sqrt(1000) = 31.62
        voter 3: total weighted votes = sqrt(1000) = 31.62

        Total weighted votes = 142.29

        voter 1 allocation = 31.62 / 142.29 * 100 = 22.22% => 2,000,000 * 22.22% = 1,111,200
        voter 2 allocation = 79.05 / 142.29 * 100 = 55.56% => 2,000,000 * 55.56% = 444,400
        voter 3 allocation = 31.62 / 142.29 * 100 = 22.22% => 2,000,000 * 22.22% = 444,400
      */
      expect(await voterRewards.getReward(xAllocationsRoundID, voter1.address)).to.equal(1111111111111111111111111n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter2.address)).to.equal(444444444444444444444444n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter3.address)).to.equal(444444444444444444444444n)

      // Now let's upgrade the GM NFT to level 10
      await b3tr.connect(minterAccount).mint(voter1, await galaxyMember.getB3TRtoUpgrade(1))

      await b3tr.connect(voter1).approve(await galaxyMember.getAddress(), await galaxyMember.getB3TRtoUpgrade(1))

      await galaxyMember.connect(voter1).upgrade(1) // Upgrade token id 1

      await b3tr.connect(minterAccount).mint(voter1, await galaxyMember.getB3TRtoUpgrade(1))

      await b3tr.connect(voter1).approve(await galaxyMember.getAddress(), await galaxyMember.getB3TRtoUpgrade(1))

      await galaxyMember.connect(voter1).upgrade(1) // Upgrade token id 1

      await b3tr.connect(minterAccount).mint(voter1, await galaxyMember.getB3TRtoUpgrade(1))

      await b3tr.connect(voter1).approve(await galaxyMember.getAddress(), await galaxyMember.getB3TRtoUpgrade(1))

      await galaxyMember.connect(voter1).upgrade(1) // Upgrade token id 1

      await b3tr.connect(minterAccount).mint(voter1, await galaxyMember.getB3TRtoUpgrade(1))

      await b3tr.connect(voter1).approve(await galaxyMember.getAddress(), await galaxyMember.getB3TRtoUpgrade(1))

      await galaxyMember.connect(voter1).upgrade(1) // Upgrade token id 1

      expect(await galaxyMember.levelOf(1)).to.equal(10)

      await waitForRoundToEnd(xAllocationsRoundID)

      // Start next cycle
      await emissions.distribute()

      xAllocationsRoundID = await xAllocationVoting.currentRoundId()

      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 2 votes 1000 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        xAllocationsRoundID,
      )

      /*
        voter 1: total weighted votes = sqrt(1000) * 25 = 31.62 * 25 = 790.5 (Level 10 GM NFT has 25x multiplier)
        voter 2: total weighted votes = sqrt(1000) = 31.62
        voter 3: total weighted votes = sqrt(1000) = 31.62

        Total weighted votes = 853.74

        voter 1 allocation = 790.5 / 853.74 * 100 = 92.5% => 2,000,000 * 92.5% = 1,850,000
        voter 2 allocation = 31.62 / 853.74 * 100 = 3.7% => 2,000,000 * 3.7% = 74,000
        voter 3 allocation = 31.62 / 853.74 * 100 = 3.7% => 2,000,000 * 3.7% = 74,000
      */
      expect(await voterRewards.getReward(xAllocationsRoundID, voter1.address)).to.equal(1851851851851851851851851n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter2.address)).to.equal(74074074074074074074074n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter3.address)).to.equal(74074074074074074074074n)

      await waitForRoundToEnd(xAllocationsRoundID)

      // Start next cycle
      await emissions.distribute()

      xAllocationsRoundID = await xAllocationVoting.currentRoundId()

      /*
        Now let's see what happens when detaching the Mjolnir node from the GM NFT

        voter 1 has spent 500,000 + 2,500,000 + 5,000,000 + 25,000,000 = 33,000,000 B3TR to upgrade the GM NFT to level 10

        Starting from Level 1 (when Mjolnir is detached), the GM NFT Level would be = Level 9 with 435,000 B3TR required to upgrade to Level 10
      */
      await galaxyMember.connect(voter1).detachNode(3, 1) // Detach Mjolnir from GM NFT

      expect(await galaxyMember.levelOf(1)).to.equal(9)
      expect(await galaxyMember.getB3TRtoUpgrade(1)).to.equal(ethers.parseEther("435000"))

      await voteOnApps(
        [app1, app2],
        [voter1, voter2, voter3],
        [
          [ethers.parseEther("1000"), ethers.parseEther("0")], // Voter 1 votes 1000 for app1
          [ethers.parseEther("0"), ethers.parseEther("1000")], // Voter 2 votes 1000 for app2
          [ethers.parseEther("500"), ethers.parseEther("500")], // Voter 3 votes 500 for app1 and 500 for app2
        ],
        xAllocationsRoundID,
      )

      /*
        voter 1: total weighted votes = sqrt(1000) * 10 = 31.62 * 10 = 316.2 (Level 9 GM NFT has 10x multiplier)
        voter 2: total weighted votes = sqrt(1000) = 31.62
        voter 3: total weighted votes = sqrt(1000) = 31.62

        Total weighted votes = 379.44

        voter 1 allocation = 316.2 / 379.44 * 100 = 83.33% => 2,000,000 * 83.33% = 1,666,600
        voter 2 allocation = 31.62 / 379.44 * 100 = 8.33% => 2,000,000 * 8.33% = 166,600
        voter 3 allocation = 31.62 / 379.44 * 100 = 8.33% => 2,000,000 * 8.33% = 166,600
      */
      expect(await voterRewards.getReward(xAllocationsRoundID, voter1.address)).to.equal(1666666666666666666666666n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter2.address)).to.equal(166666666666666666666666n)
      expect(await voterRewards.getReward(xAllocationsRoundID, voter3.address)).to.equal(166666666666666666666666n)
    })
  })
})
