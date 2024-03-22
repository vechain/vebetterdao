import { describe, it } from "mocha"
import {
  bootstrapEmissions,
  catchRevert,
  getOrDeployContractInstances,
  moveToCycle,
  waitForBlock,
  waitForNextCycle,
} from "./helpers"
import { assert, expect } from "chai"
import { ethers, network } from "hardhat"
import { calculateTreasuryAllocation } from "./helpers/allocations"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { createTestConfig } from "./helpers/config"
import { generateB3trAllocations } from "./helpers/generateB3trAllocations"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"

describe("Emissions", () => {
  describe("Contract parameters", () => {
    it("Should have correct parameters set on deployment", async () => {
      const config = createLocalConfig()
      const { emissions, owner, otherAccounts, b3tr, minterAccount, xAllocationPool, voterRewards } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      // Destination addresses should be set correctly
      expect(await emissions.xAllocations()).to.equal(await xAllocationPool.getAddress())
      expect(await emissions.vote2Earn()).to.equal(await voterRewards.getAddress())
      expect(await emissions.treasury()).to.equal(otherAccounts[2].address)

      // Admin should be set correctly
      expect(await emissions.hasRole(await emissions.DEFAULT_ADMIN_ROLE(), await owner.getAddress())).to.equal(true)

      // Minter should be set correctly
      expect(await emissions.hasRole(await emissions.MINTER_ROLE(), await minterAccount.getAddress())).to.equal(true)

      // Initial allocation amounts should be set correctly
      const initialEmissions = await emissions.initialXAppAllocation()
      expect(initialEmissions).to.equal(config.INITIAL_X_ALLOCATION)

      // B3TR address should be set correctly
      expect(await emissions.b3tr()).to.equal(await b3tr.getAddress())

      // Decay settings should be set correctly
      expect(await emissions.xAllocationsDecay()).to.equal(config.EMISSIONS_X_ALLOCATION_DECAY_PERCENTAGE)
      expect(await emissions.vote2EarnDecay()).to.equal(config.EMISSIONS_VOTE_2_EARN_DECAY_PERCENTAGE)
      expect(await emissions.xAllocationsDecayPeriod()).to.equal(config.EMISSIONS_X_ALLOCATION_DECAY_PERIOD)
      expect(await emissions.vote2EarnDecayPeriod()).to.equal(config.EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD)

      // Treasury percentage should be set correctly
      expect(await emissions.treasuryPercentage()).to.equal(config.EMISSIONS_TREASURY_PERCENTAGE)
    })

    it("Should be able to change the X allocations address", async () => {
      const { emissions, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await emissions.connect(owner).setXallocationsAddress(otherAccounts[3].address)

      expect(await emissions.xAllocations()).to.equal(otherAccounts[3].address)
    })

    it("Should be able to change the Vote 2 Earn address", async () => {
      const { emissions, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await emissions.connect(owner).setVote2EarnAddress(otherAccounts[3].address)

      expect(await emissions.vote2Earn()).to.equal(otherAccounts[3].address)
    })

    it("Should be able to change the Treasury address", async () => {
      const { emissions, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await emissions.connect(owner).setTreasuryAddress(otherAccounts[3].address)

      expect(await emissions.treasury()).to.equal(otherAccounts[3].address)
    })

    it("Should not be able to change the X allocations address if not admin", async () => {
      const { emissions, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(emissions.connect(otherAccounts[0]).setXallocationsAddress(otherAccounts[3].address))
    })

    it("Treasury percentage should be between 0 and 10000", async () => {
      const { emissions, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(emissions.connect(owner).setTreasuryPercentage(10001))
      try {
        await emissions.connect(owner).setTreasuryPercentage(-1)
        assert.fail("Should revert")
      } catch (e) {
        /* empty */
      }
      await emissions.connect(owner).setTreasuryPercentage(10000)
      await emissions.connect(owner).setTreasuryPercentage(0)
      await emissions.connect(owner).setTreasuryPercentage(550)
    })

    it("MaxVote2EarnDecay percentage should be between 0 and 100", async () => {
      const { emissions, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(emissions.connect(owner).setMaxVote2EarnDecay(101))
      try {
        await emissions.connect(owner).setMaxVote2EarnDecay(-1)
        assert.fail("Should revert")
      } catch (e) {
        /* empty */
      }
      await emissions.connect(owner).setMaxVote2EarnDecay(100)
      await emissions.connect(owner).setMaxVote2EarnDecay(0)
      await emissions.connect(owner).setMaxVote2EarnDecay(55)
    })

    it("Vote2EarnDecay percentage should be between 0 and 100", async () => {
      const { emissions, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(emissions.connect(owner).setVote2EarnDecay(101))
      try {
        await emissions.connect(owner).setVote2EarnDecay(-1)
        assert.fail("Should revert")
      } catch (e) {
        /* empty */
      }
      await emissions.connect(owner).setVote2EarnDecay(100)
      await emissions.connect(owner).setVote2EarnDecay(0)
      await emissions.connect(owner).setVote2EarnDecay(55)
    })

    it("XAllocationsDecay percentage should be between 0 and 100", async () => {
      const { emissions, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(emissions.connect(owner).setXAllocationsDecay(101))
      try {
        await emissions.connect(owner).setXAllocationsDecay(-1)
        assert.fail("Should revert")
      } catch (e) {
        /* empty */
      }
      await emissions.connect(owner).setXAllocationsDecay(100)
      await emissions.connect(owner).setXAllocationsDecay(0)
      await emissions.connect(owner).setXAllocationsDecay(55)
    })

    // it("getScaledDecayPercentage: decay percentage should be between 0 and 99", async () => {
    //   const { emissions, owner } = await getOrDeployContractInstances({
    //     forceDeploy: true,
    //   })

    //   await expect(emissions.connect(owner).getScaledDecayPercentage(101)).to.be.reverted
    //   try {
    //     await emissions.connect(owner).getScaledDecayPercentage(-1)
    //     assert.fail("Should revert")
    //   } catch (e) {
    //     /* empty */
    //   }
    //   await expect(emissions.connect(owner).getScaledDecayPercentage(100)).to.be.reverted

    //   await expect(emissions.connect(owner).getScaledDecayPercentage(0)).not.to.be.reverted
    //   await expect(emissions.connect(owner).getScaledDecayPercentage(55)).not.to.be.reverted
    // })
  })

  describe("Contract upgradeablity", () => {
    it("Admin should be able to upgrade the contract", async function () {
      const { emissions, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("Emissions")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await emissions.getAddress())

      const UPGRADER_ROLE = await emissions.UPGRADER_ROLE()
      expect(await emissions.hasRole(UPGRADER_ROLE, owner.address)).to.eql(true)

      await expect(emissions.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await emissions.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Only admin should be able to upgrade the contract", async function () {
      const { emissions, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("Emissions")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await emissions.getAddress())

      const UPGRADER_ROLE = await emissions.UPGRADER_ROLE()
      expect(await emissions.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(emissions.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await emissions.getAddress())

      expect(newImplAddress.toUpperCase()).to.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.not.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Admin can change UPGRADER_ROLE", async function () {
      const { emissions, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("Emissions")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await emissions.getAddress())

      const UPGRADER_ROLE = await emissions.UPGRADER_ROLE()
      expect(await emissions.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(emissions.connect(owner).grantRole(UPGRADER_ROLE, otherAccount.address)).to.not.be.reverted
      await expect(emissions.connect(owner).revokeRole(UPGRADER_ROLE, owner.address)).to.not.be.reverted

      await expect(emissions.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await emissions.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })
  })

  describe("Bootstrap emissions", () => {
    it("Should be able to bootstrap emissions", async () => {
      const config = createLocalConfig()
      const { emissions, b3tr, minterAccount, otherAccounts, owner, xAllocationPool, voterRewards } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      const tx = await emissions.connect(minterAccount).bootstrap()

      const receipt = await tx.wait()

      if (!receipt?.logs) throw new Error("No logs in receipt")

      const events = receipt?.logs

      const decodedEvents = events?.map(event => {
        return emissions.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      const emissionDistributedEvent = decodedEvents.find(event => event?.name === "EmissionDistributed")

      const initialVoteAllocation = config.INITIAL_X_ALLOCATION
      const initialTreasuryAlloc = calculateTreasuryAllocation(
        config.INITIAL_X_ALLOCATION,
        initialVoteAllocation,
        BigInt(config.EMISSIONS_TREASURY_PERCENTAGE),
      )

      expect(emissionDistributedEvent?.args?.cycle).to.equal(1)
      expect(emissionDistributedEvent?.args.xAllocations).to.equal(config.INITIAL_X_ALLOCATION)
      expect(emissionDistributedEvent?.args.vote2Earn).to.equal(initialVoteAllocation)
      expect(emissionDistributedEvent?.args.treasury).to.equal(initialTreasuryAlloc)

      expect(await b3tr.balanceOf(await xAllocationPool.getAddress())).to.equal(config.INITIAL_X_ALLOCATION)
      expect(await b3tr.balanceOf(await voterRewards.getAddress())).to.equal(initialVoteAllocation)
      expect(await b3tr.balanceOf(otherAccounts[2].address)).to.equal(initialTreasuryAlloc)

      expect(await emissions.getXAllocationAmount(1)).to.equal(config.INITIAL_X_ALLOCATION)
      expect(await emissions.getVote2EarnAmount(1)).to.equal(initialVoteAllocation)
      expect(await emissions.getTreasuryAmount(1)).to.equal(initialTreasuryAlloc)

      expect(await emissions.nextCycle()).to.equal(1)
    })

    it("Should not be able to bootstrap emissions if B3TR transfers are paused", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      await b3tr.connect(owner).pause()

      await catchRevert(emissions.connect(minterAccount).bootstrap())

      await b3tr.connect(owner).unpause()

      await emissions.connect(minterAccount).bootstrap() // Now we should be able to bootstrap due to unpausing
    })

    it("Should not be able to bootstrap emissions twice", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Try to bootstrap emissions again - Should revert
      await catchRevert(emissions.connect(minterAccount).bootstrap())
    })
  })

  describe("Start emissions", () => {
    it("Should be able to start emissions", async () => {
      const config = createLocalConfig()
      const { emissions, b3tr, minterAccount, otherAccounts, owner, xAllocationPool, voterRewards } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      const tx = await emissions.connect(minterAccount).start()

      const receipt = await tx.wait()

      if (!receipt?.logs) throw new Error("No logs in receipt")

      const initialVoteAllocation = config.INITIAL_X_ALLOCATION
      const initialTreasuryAlloc = calculateTreasuryAllocation(
        config.INITIAL_X_ALLOCATION,
        initialVoteAllocation,
        BigInt(config.EMISSIONS_TREASURY_PERCENTAGE),
      )

      expect(await b3tr.balanceOf(await xAllocationPool.getAddress())).to.equal(config.INITIAL_X_ALLOCATION)
      expect(await b3tr.balanceOf(await voterRewards.getAddress())).to.equal(initialVoteAllocation)
      expect(await b3tr.balanceOf(otherAccounts[2].address)).to.equal(initialTreasuryAlloc)

      expect(await emissions.getXAllocationAmount(1)).to.equal(config.INITIAL_X_ALLOCATION)
      expect(await emissions.getVote2EarnAmount(1)).to.equal(initialVoteAllocation)
      expect(await emissions.getTreasuryAmount(1)).to.equal(initialTreasuryAlloc)

      expect(await emissions.nextCycle()).to.equal(2)
    })

    it("Should not be able to start emissions if B3TR transfers are paused", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await b3tr.connect(owner).pause()

      await catchRevert(emissions.connect(minterAccount).start())

      await b3tr.connect(owner).unpause()

      await emissions.connect(minterAccount).start() // Now we should be able to start emissions due to unpausing
    })

    it("Should not be able start emissions twice", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      // Try to start emissions again - Should revert
      await catchRevert(emissions.connect(minterAccount).start())
    })

    it("Should not be able to start emissions if not bootstapped", async () => {
      const { emissions, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Try to start emissions without bootstrapping - Should revert
      await catchRevert(emissions.connect(minterAccount).start())
    })
  })

  describe("Emissions distribution", () => {
    it("Should be able to calculate emissions correctly for first cycle", async () => {
      const config = createLocalConfig()
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      // Expect next cycle to be 2
      expect(await emissions.nextCycle()).to.equal(2)

      await waitForNextCycle(emissions)

      // Calculate emissions for first cycle
      const xAllocationAmount = await emissions.getXAllocationAmount(2)
      const vote2EarnAmount = await emissions.getVote2EarnAmount(2)
      const treasuryAmount = await emissions.getTreasuryAmount(2)

      const initialVoteAllocation = config.INITIAL_X_ALLOCATION
      const initialTreasuryAlloc = calculateTreasuryAllocation(
        config.INITIAL_X_ALLOCATION,
        initialVoteAllocation,
        BigInt(config.EMISSIONS_TREASURY_PERCENTAGE),
      )

      expect(xAllocationAmount).to.equal(config.INITIAL_X_ALLOCATION)
      expect(vote2EarnAmount).to.equal(initialVoteAllocation)
      expect(treasuryAmount).to.equal(initialTreasuryAlloc)

      // Distribute emissions
      const tx = await emissions.connect(minterAccount).distribute()

      const receipt = await tx.wait()

      if (!receipt?.logs) throw new Error("No logs in receipt")

      const events = receipt?.logs

      const decodedEvents = events?.map(event => {
        return emissions.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      const emissionDistributedEvent = decodedEvents.find(event => event?.name === "EmissionDistributed")

      expect(emissionDistributedEvent?.args?.cycle).to.equal(2)
      expect(emissionDistributedEvent?.args.xAllocations).to.equal(xAllocationAmount)
      expect(emissionDistributedEvent?.args.vote2Earn).to.equal(vote2EarnAmount)
      expect(emissionDistributedEvent?.args.treasury).to.equal(treasuryAmount)

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(
        (config.INITIAL_X_ALLOCATION + initialVoteAllocation + initialTreasuryAlloc) * 2n,
      )
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(config.INITIAL_X_ALLOCATION * 2n)
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(initialVoteAllocation * 2n)
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(initialTreasuryAlloc * 2n)
    })

    it("Should not be able to distribute emissions if B3TR transfers are paused", async () => {
      const config = createLocalConfig()
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      await waitForNextCycle(emissions)

      // Pause B3TR transfers
      await b3tr.connect(owner).pause()

      // Try to distribute emissions - Should revert
      await catchRevert(emissions.connect(minterAccount).distribute())

      // Unpause B3TR transfers
      await b3tr.connect(owner).unpause()

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()
    })

    it("Should not be able to distribute emissions before next cycle starts", async () => {
      const config = createLocalConfig()
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      expect(await emissions.nextCycle()).to.equal(2)

      // Calculate emissions for first cycle
      const initialVoteAllocation = config.INITIAL_X_ALLOCATION
      const initialTreasuryAlloc = calculateTreasuryAllocation(
        config.INITIAL_X_ALLOCATION,
        initialVoteAllocation,
        BigInt(config.EMISSIONS_TREASURY_PERCENTAGE),
      )

      const xAllocationsAmount = await emissions.getXAllocationAmount(2)
      const vote2EarnAmount = await emissions.getVote2EarnAmount(2)
      const treasuryAmount = await emissions.getTreasuryAmount(2)

      expect(xAllocationsAmount).to.equal(config.INITIAL_X_ALLOCATION)
      expect(vote2EarnAmount).to.equal(initialVoteAllocation)
      expect(treasuryAmount).to.equal(initialTreasuryAlloc)

      // Try to distribute emissions before next cycle starts - Should revert
      await catchRevert(emissions.connect(minterAccount).distribute())
    })

    it("Should be able to calculate emissions correctly for second cycle", async () => {
      const config = createLocalConfig()
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      await waitForNextCycle(emissions)

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      expect(await emissions.isCycleDistributed(2)).to.equal(true)

      const initialVoteAllocation = config.INITIAL_X_ALLOCATION
      const initialTreasuryAlloc = calculateTreasuryAllocation(
        config.INITIAL_X_ALLOCATION,
        initialVoteAllocation,
        BigInt(config.EMISSIONS_TREASURY_PERCENTAGE),
      )

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(
        (config.INITIAL_X_ALLOCATION + initialVoteAllocation + initialTreasuryAlloc) * 2n,
      )
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(config.INITIAL_X_ALLOCATION * 2n)
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(initialVoteAllocation * 2n)
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(initialTreasuryAlloc * 2n)

      await waitForNextCycle(emissions)

      expect(await emissions.nextCycle()).to.equal(3)

      // Calculate emissions for second cycle
      const xAllocationsAmount = await emissions.getXAllocationAmount(3)
      const vote2EarnAmount = await emissions.getVote2EarnAmount(3)
      const treasuryAmount = await emissions.getTreasuryAmount(3)

      expect(xAllocationsAmount).to.equal(config.INITIAL_X_ALLOCATION)
      expect(vote2EarnAmount).to.equal(initialVoteAllocation)
      expect(treasuryAmount).to.equal(initialTreasuryAlloc)

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      expect(await emissions.isCycleDistributed(3)).to.equal(true)

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(
        (config.INITIAL_X_ALLOCATION + initialVoteAllocation + initialTreasuryAlloc) * 3n,
      )
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(config.INITIAL_X_ALLOCATION * 3n)
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(initialVoteAllocation * 3n)
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(initialTreasuryAlloc * 3n)

      expect(await emissions.nextCycle()).to.equal(4)
    })

    it("Should calculate emissions properly after first X-Alloc decay period", async () => {
      const config = createTestConfig()
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      await waitForNextCycle(emissions)

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(ethers.parseEther("10000000"))
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(ethers.parseEther("4000000"))
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(ethers.parseEther("4000000"))
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(ethers.parseEther("2000000"))

      // Move to after first decay period
      const cycle = config.EMISSIONS_X_ALLOCATION_DECAY_PERIOD + 2
      await moveToCycle(emissions, minterAccount, cycle)

      expect(await emissions.nextCycle()).to.equal(cycle)

      await waitForNextCycle(emissions)

      const xAllocationsAmount = await emissions.getXAllocationAmount(cycle)
      const vote2EarnAmount = await emissions.getVote2EarnAmount(cycle)
      const treasuryAmount = await emissions.getTreasuryAmount(cycle)

      // Check allocations after decay
      expect(xAllocationsAmount).to.equal(ethers.parseEther("1920000"))
      expect(vote2EarnAmount).to.equal(ethers.parseEther("1920000"))
      expect(treasuryAmount).to.equal(ethers.parseEther("960000"))

      // Check supply
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(ethers.parseEther("25920000"))
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(ethers.parseEther("25920000"))
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(ethers.parseEther("12960000"))
      expect(await b3tr.totalSupply()).to.equal(ethers.parseEther("64800000"))
    }).timeout(1000 * 60 * 10) // 10 minutes

    it("Should calculate emissions properly after first Rewards decay period", async () => {
      const config = createTestConfig()
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      await waitForNextCycle(emissions)

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(ethers.parseEther("10000000"))
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(ethers.parseEther("4000000"))
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(ethers.parseEther("4000000"))
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(ethers.parseEther("2000000"))

      // Move to after first Rewards decay period
      const cycle = config.EMISSIONS_VOTE_2_EARN_ALLOCATION_DECAY_PERIOD + 2
      await moveToCycle(emissions, minterAccount, cycle)

      expect(await emissions.nextCycle()).to.equal(cycle)

      await waitForNextCycle(emissions)

      const xAllocationsAmount = await emissions.getXAllocationAmount(cycle)
      const vote2EarnAmount = await emissions.getVote2EarnAmount(cycle)
      const treasuryAmount = await emissions.getTreasuryAmount(cycle)

      // Check allocations after decay
      expect(xAllocationsAmount).to.equal(ethers.parseEther("1698693.12"))
      expect(vote2EarnAmount).to.equal(ethers.parseEther("1358954.496"))
      expect(treasuryAmount).to.equal(ethers.parseEther("764411.904"))

      // Check supply
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(ethers.parseEther("95488143.36"))
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(ethers.parseEther("95148404.736"))
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(ethers.parseEther("47659137.024"))
      expect(await b3tr.totalSupply()).to.equal(ethers.parseEther("238295685.12"))
    }).timeout(1000 * 60 * 10) // 10 minutes

    it("Should calculate decay amounts correctly for pilot show parameters", async () => {
      const config = createLocalConfig()
      const { emissions, owner, minterAccount, b3tr } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      expect(await emissions.nextCycle()).to.equal(1)

      // Start emissions
      await emissions.connect(minterAccount).start()

      // Variables to hold calculated amounts for assertions
      let xAllocationsAmount = BigInt(0)
      let vote2EarnAmount = BigInt(0)
      let treasuryAmount = BigInt(0)
      let _totalEmissions = BigInt(0)
      const cap = await b3tr.cap()

      expect(await emissions.nextCycle()).to.equal(2)

      const b3trAllocations = await generateB3trAllocations(config, "./test/fixture/pilot-show-allocations.json")
      // const b3trAllocations = await generateB3trAllocations(config)

      // Loop through all cycles as simulated in the b3tr emissions spreadsheet
      for (let i = 0; i < b3trAllocations.length; i++) {
        await waitForNextCycle(emissions)

        const allocations = b3trAllocations[i]

        // Calculate decayed amounts
        xAllocationsAmount = await emissions.getXAllocationAmount(allocations.cycle)
        vote2EarnAmount = await emissions.getVote2EarnAmount(allocations.cycle)
        treasuryAmount = await emissions.getTreasuryAmount(allocations.cycle)
        const totalEmissionsFromContract = await emissions.totalEmissions()
        _totalEmissions = _totalEmissions + xAllocationsAmount + vote2EarnAmount + treasuryAmount
        const remainingEmissionsFromContract = await emissions.getRemainingEmissions()

        // Log the cycle and amounts for debugging
        // Uncomment to view the emissions for each cycle
        // console.log(
        //   `Cycle ${allocations.cycle}: XAllocations = ${ethers.formatEther(xAllocationsAmount)}, Vote2Earn = ${ethers.formatEther(vote2EarnAmount)}`,
        //   `Treasury = ${ethers.formatEther(treasuryAmount)} Total Emissions = ${ethers.formatEther(totalEmissionsFromContract)} Remaining Emissions = ${ethers.formatEther(remainingEmissionsFromContract)}`,
        // )

        // Assert the calculated amounts match the expected amounts from the spreadsheet
        expect(xAllocationsAmount).to.equal(allocations.xAllocation)
        expect(vote2EarnAmount).to.equal(allocations.vote2EarnAllocation)
        // expect("Actual").to.equal("Expected")
        expect(treasuryAmount).to.equal(allocations.treasuryAllocation)
        expect(totalEmissionsFromContract).to.equal(_totalEmissions)
        expect(remainingEmissionsFromContract).to.equal(cap - totalEmissionsFromContract)

        // Don't distribute on the last cycle
        if (i >= b3trAllocations.length - 1) {
          // console.log(`Not distributing cycle ${allocations.cycle}`)
          continue
        }

        // console.log(`Distributing cycle ${allocations.cycle + 1}`)
        await emissions.distribute()

        expect(await emissions.getCurrentCycle()).to.equal(allocations.cycle + 1)
      }
    }).timeout(1000 * 60 * 10) // 10 minutes

    it("Should not be able to start emissions if not minter", async () => {
      const { emissions, minterAccount, b3tr, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      await catchRevert(emissions.connect(otherAccount).start())
    })

    it("Should be able to perform all cycles till reaching B3TR supply cap", async function () {
      if (network.name !== "hardhat") {
        console.log(`\nThe test "${this?.test?.title}" is only supported on hardhat network. Skipping...\n`)
        return
      }
      const config = createTestConfig()
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      // Variables to hold calculated amounts for assertions
      let xAllocationsAmount = BigInt(0)
      let vote2EarnAmount = BigInt(0)
      let treasuryAmount = BigInt(0)
      let _totalEmissions = BigInt(0)
      const cap = await b3tr.cap()

      const b3trAllocations = await generateB3trAllocations(config, "./test/fixture/full-allocations.json")
      // const b3trAllocations = await generateB3trAllocations(config)

      // Loop through all cycles as simulated in the b3tr emissions spreadsheet
      for (let i = 0; i < b3trAllocations.length; i++) {
        await waitForNextCycle(emissions)

        const allocations = b3trAllocations[i]

        // Calculate decayed amounts
        xAllocationsAmount = await emissions.getXAllocationAmount(allocations.cycle)
        vote2EarnAmount = await emissions.getVote2EarnAmount(allocations.cycle)
        treasuryAmount = await emissions.getTreasuryAmount(allocations.cycle)
        const totalEmissionsFromContract = await emissions.totalEmissions()
        _totalEmissions = _totalEmissions + xAllocationsAmount + vote2EarnAmount + treasuryAmount
        const remainingEmissionsFromContract = await emissions.getRemainingEmissions()

        // Log the cycle and amounts for debugging
        // Uncomment to view the emissions for each cycle
        // console.log(
        //   `Cycle ${allocations.cycle}: XAllocations = ${ethers.formatEther(xAllocationsAmount)}, Vote2Earn = ${ethers.formatEther(vote2EarnAmount)}`,
        //   `Treasury = ${ethers.formatEther(treasuryAmount)} Total Emissions = ${ethers.formatEther(totalEmissionsFromContract)} Remaining Emissions = ${ethers.formatEther(remainingEmissionsFromContract)}`,
        // )

        // Assert the calculated amounts match the expected amounts from the spreadsheet
        expect(xAllocationsAmount).to.equal(allocations.xAllocation)
        expect(vote2EarnAmount).to.equal(allocations.vote2EarnAllocation)
        expect(treasuryAmount).to.equal(allocations.treasuryAllocation)
        expect(totalEmissionsFromContract).to.equal(_totalEmissions)
        expect(remainingEmissionsFromContract).to.equal(cap - totalEmissionsFromContract)

        // Don't distribute on the last cycle
        if (i >= b3trAllocations.length - 1) {
          // console.log(`Not distributing cycle ${allocations.cycle}`)
          continue
        }

        // console.log(`Distributing cycle ${allocations.cycle + 1}`)
        await emissions.distribute()

        expect(await emissions.getCurrentCycle()).to.equal(allocations.cycle + 1)
      }

      await catchRevert(emissions.connect(minterAccount).distribute()) // Should not be able to distribute more than the B3TR supply cap

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(await emissions.totalEmissions()) // 999,884,045.14 B3TR
    }).timeout(1000 * 60 * 5) // 5 minutes

    it("Should not be able to distribute if cycle is not ready", async () => {
      const { emissions, minterAccount, b3tr, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      await waitForNextCycle(emissions)

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      await catchRevert(emissions.connect(minterAccount).distribute())
    })

    it("Should be able to perform emissions also after the next cycle block", async () => {
      const { emissions, minterAccount, b3tr, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Start emissions
      await emissions.connect(minterAccount).start()

      await waitForNextCycle(emissions)

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      await waitForNextCycle(emissions)

      await waitForBlock(10) // Simulate a delay of 10 blocks before distributing the next cycle

      await emissions.connect(minterAccount).distribute()

      expect(await emissions.getCurrentCycle()).to.equal(3)

      await waitForNextCycle(emissions)

      await emissions.connect(minterAccount).distribute()
    })
  })
})
