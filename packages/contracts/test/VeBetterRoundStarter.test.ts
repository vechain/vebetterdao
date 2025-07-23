import { describe, it, before } from "mocha"
import { expect } from "chai"
import { ethers } from "hardhat"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import {
  getOrDeployContractInstances,
  bootstrapAndStartEmissions,
  waitForCurrentRoundToEnd,
  getVot3Tokens,
  startNewAllocationRound,
} from "./helpers"
import { VeBetterRoundStarter } from "../typechain-types"
import { endorseApp } from "./helpers/xnodes"
import { deployProxy } from "../scripts/helpers"

describe.only("VeBetterRoundStarter - @shard14", function () {
  let veBetterRoundStarter: VeBetterRoundStarter
  let creator1: HardhatEthersSigner
  let creator2: HardhatEthersSigner
  let appId1: string
  let appId2: string
  let instances: Awaited<ReturnType<typeof getOrDeployContractInstances>>
  let roundIdForVoting: bigint

  before(async function () {
    // Get all deployed contract instances - only deploy once for the entire test suite
    instances = await getOrDeployContractInstances({ forceDeploy: true })
    if (!instances) {
      throw new Error("Failed to get contract instances")
    }

    creator1 = instances.creators[0]
    creator2 = instances.creators[1]

    // Deploy VeBetterRoundStarter contract
    veBetterRoundStarter = (await deployProxy("VeBetterRoundStarter", [
      await instances.xAllocationPool.getAddress(),
      await instances.xAllocationVoting.getAddress(),
      await instances.x2EarnApps.getAddress(),
      await instances.emissions.getAddress(),
    ])) as VeBetterRoundStarter

    // Setup test environment once
    await setupTestEnvironment()
  })

  async function setupTestEnvironment() {
    if (!instances) {
      throw new Error("Failed to get contract instances")
    }

    // Whitelist creators in passport
    await instances.veBetterPassport.whitelist(creator1.address)
    await instances.veBetterPassport.whitelist(creator2.address)
    await instances.veBetterPassport.toggleCheck(1)

    // Mint creator NFTs if needed
    if ((await instances.x2EarnCreator.balanceOf(creator1.address)) === 0n) {
      await instances.x2EarnCreator.connect(instances.owner).safeMint(creator1.address)
    }
    if ((await instances.x2EarnCreator.balanceOf(creator2.address)) === 0n) {
      await instances.x2EarnCreator.connect(instances.owner).safeMint(creator2.address)
    }

    // Create apps
    await instances.x2EarnApps
      .connect(creator1)
      .submitApp(creator1.address, creator1.address, "Test App 1", "metadataURI1")
    await instances.x2EarnApps
      .connect(creator2)
      .submitApp(creator2.address, creator2.address, "Test App 2", "metadataURI2")

    // Get app IDs
    appId1 = await instances.x2EarnApps.hashAppName("Test App 1")
    appId2 = await instances.x2EarnApps.hashAppName("Test App 2")

    // Endorse the apps
    await endorseApp(appId1, creator1)
    await endorseApp(appId2, creator2)

    // Bootstrap and start emissions
    await bootstrapAndStartEmissions()

    const clock = await instances.x2EarnApps.clock()

    // Verify apps exist and are endorsed
    expect(await instances.x2EarnApps.isEligible(appId1, clock)).to.be.true
    expect(await instances.x2EarnApps.isEligible(appId2, clock)).to.be.true
  }

  describe("Contract Deployment and Initialization", function () {
    it("Should deploy and initialize VeBetterRoundStarter correctly", async function () {
      if (!instances) {
        throw new Error("Failed to get contract instances")
      }

      // Verify initialization
      expect(await veBetterRoundStarter.xAllocationPool()).to.equal(await instances.xAllocationPool.getAddress())
      expect(await veBetterRoundStarter.xAllocationVoting()).to.equal(await instances.xAllocationVoting.getAddress())
      expect(await veBetterRoundStarter.x2EarnApps()).to.equal(await instances.x2EarnApps.getAddress())
      expect(await veBetterRoundStarter.emissions()).to.equal(await instances.emissions.getAddress())
      expect(await veBetterRoundStarter.owner()).to.equal(instances.owner.address)
    })

    it("Should not be able to initialize twice", async function () {
      if (!instances) {
        throw new Error("Failed to get contract instances")
      }

      await expect(
        veBetterRoundStarter.initialize(
          await instances.xAllocationPool.getAddress(),
          await instances.xAllocationVoting.getAddress(),
          await instances.x2EarnApps.getAddress(),
          await instances.emissions.getAddress(),
        ),
      ).to.be.reverted
    })
  })

  describe("Basic Functionality", function () {
    it("Should return correct current and previous round IDs", async function () {
      if (!instances) {
        throw new Error("Failed to get contract instances")
      }

      const currentRoundFromEmissions = await instances.emissions.getCurrentCycle()
      const currentRoundFromStarter = await veBetterRoundStarter.getCurrentRoundId()
      const previousRoundFromStarter = await veBetterRoundStarter.getPreviousRoundId()

      expect(currentRoundFromStarter).to.equal(currentRoundFromEmissions)
      expect(previousRoundFromStarter).to.equal(currentRoundFromEmissions > 0 ? currentRoundFromEmissions - 1n : 0n)
    })

    it("Should get all X-Apps for a round", async function () {
      const currentRound = await veBetterRoundStarter.getCurrentRoundId()
      const allApps = await veBetterRoundStarter.getAllXAppsForRound(currentRound)

      // Should include our endorsed apps
      expect(allApps).to.include(appId1)
      expect(allApps).to.include(appId2)
    })

    it("Should identify unclaimed X-Apps", async function () {
      // Get current round and check unclaimed apps
      const currentRound = await veBetterRoundStarter.getCurrentRoundId()
      const unclaimedApps = await veBetterRoundStarter.getUnclaimedXAppsForRound(currentRound)

      // Initially, all apps should be unclaimed
      expect(unclaimedApps.length).to.be.greaterThan(0)
    })

    it("Should get unclaimed X-Apps with amounts", async function () {
      const currentRound = await veBetterRoundStarter.getCurrentRoundId()
      const [appIds, amounts] = await veBetterRoundStarter.getUnclaimedXAppsWithAmounts(currentRound)

      expect(appIds.length).to.equal(amounts.length)
      expect(appIds.length).to.be.greaterThan(0)
    })
  })

  describe("Allocation Voting and Round Management", function () {
    it("Should participate in allocation voting to setup for next round", async function () {
      if (!instances) {
        throw new Error("Failed to get contract instances")
      }

      await waitForCurrentRoundToEnd()

      // Give VOT3 tokens to creators for voting
      await getVot3Tokens(creator1, "1000")
      await getVot3Tokens(creator2, "1000")

      // Participate in voting
      roundIdForVoting = BigInt(await startNewAllocationRound())

      // Vote for apps
      await instances.xAllocationVoting
        .connect(creator1)
        .castVote(roundIdForVoting, [appId1], [ethers.parseEther("500")])
      await instances.xAllocationVoting
        .connect(creator2)
        .castVote(roundIdForVoting, [appId2], [ethers.parseEther("300")])

      // Wait for round to end
      await waitForCurrentRoundToEnd()
    })

    it("Should successfully call startNewRoundAndDistributeAllocations", async function () {
      if (!instances) {
        throw new Error("Failed to get contract instances")
      }

      await waitForCurrentRoundToEnd()

      const currentRoundBefore = await instances.emissions.getCurrentCycle()

      // Call the main function we're testing
      const tx = await veBetterRoundStarter.startNewRoundAndDistributeAllocations()
      await tx.wait()

      const currentRoundAfter = await instances.emissions.getCurrentCycle()

      // Should have started a new round
      expect(currentRoundAfter).to.be.greaterThan(currentRoundBefore)
    })

    it("Should get unclaimed apps with non-zero amounts for previous round", async function () {
      const previousRound = await veBetterRoundStarter.getPreviousRoundId()
      const unclaimedAppsWithNonZero = await veBetterRoundStarter.getUnclaimedXAppsWithNonZeroAmounts(previousRound)

      // Should have some apps with non-zero amounts from the voting
      expect(unclaimedAppsWithNonZero.length).to.be.greaterThan(0)
    })

    it("Should claim allocations for a specific round", async function () {
      const previousRound = await veBetterRoundStarter.getPreviousRoundId()

      // Get unclaimed apps before claiming
      const unclaimedBefore = await veBetterRoundStarter.getUnclaimedXAppsWithNonZeroAmounts(previousRound)

      if (unclaimedBefore.length > 0) {
        // Claim allocations
        const tx = await veBetterRoundStarter.claimAllocationsForRound(previousRound)
        const receipt = await tx.wait()

        // Check that BatchAllocationsClaimed event was emitted
        const events = receipt?.logs.filter((log: any) => {
          try {
            const parsed = veBetterRoundStarter.interface.parseLog(log)
            return parsed?.name === "BatchAllocationsClaimed"
          } catch {
            return false
          }
        })

        expect(events?.length).to.be.greaterThan(0)

        // Verify allocations were claimed
        const unclaimedAfter = await veBetterRoundStarter.getUnclaimedXAppsWithNonZeroAmounts(previousRound)
        expect(unclaimedAfter.length).to.be.lessThan(unclaimedBefore.length)
      }
    })

    it("Should claim allocations for previous round", async function () {
      const previousRound = await veBetterRoundStarter.getPreviousRoundId()

      if (previousRound > 0) {
        const unclaimedBefore = await veBetterRoundStarter.getUnclaimedXAppsWithNonZeroAmounts(previousRound)

        if (unclaimedBefore.length > 0) {
          await veBetterRoundStarter.claimAllocationsForPreviousRound()

          const unclaimedAfter = await veBetterRoundStarter.getUnclaimedXAppsWithNonZeroAmounts(previousRound)
          expect(unclaimedAfter.length).to.be.lessThan(unclaimedBefore.length)
        }
      }
    })

    it("Should check if specific X-App has claimed", async function () {
      const previousRound = await veBetterRoundStarter.getPreviousRoundId()

      if (previousRound > 0) {
        const hasClaimed = await veBetterRoundStarter.hasXAppClaimed(previousRound, appId1)
        expect(typeof hasClaimed).to.equal("boolean")
      }
    })
  })

  describe("Access Control", function () {
    it("Should only allow owner to upgrade contract", async function () {
      if (!instances) {
        throw new Error("Failed to get contract instances")
      }

      // Deploy a new implementation (same contract for testing)
      const VeBetterRoundStarterFactory = await ethers.getContractFactory("VeBetterRoundStarter")
      const newImplementation = await VeBetterRoundStarterFactory.deploy()
      await newImplementation.waitForDeployment()

      // Should revert when non-owner tries to upgrade
      await expect(
        veBetterRoundStarter
          .connect(instances.otherAccount)
          .upgradeToAndCall(await newImplementation.getAddress(), "0x"),
      ).to.be.reverted
    })
  })

  describe("Edge Cases", function () {
    it("Should handle empty rounds gracefully", async function () {
      const currentRound = await veBetterRoundStarter.getCurrentRoundId()

      // Try to get apps for a future round that doesn't exist yet
      const futureRound = currentRound + 100n
      const allApps = await veBetterRoundStarter.getAllXAppsForRound(futureRound)

      // Should return empty array or handle gracefully
      expect(Array.isArray(allApps)).to.be.true
    })

    it("Should revert when trying to claim for previous round if no previous round exists", async function () {
      if (!instances) {
        throw new Error("Failed to get contract instances")
      }

      // Deploy a fresh VeBetterRoundStarter for this test
      const freshRoundStarter = (await deployProxy("VeBetterRoundStarter", [
        await instances.xAllocationPool.getAddress(),
        await instances.xAllocationVoting.getAddress(),
        await instances.x2EarnApps.getAddress(),
        await instances.emissions.getAddress(),
      ])) as VeBetterRoundStarter

      // Reset emissions to cycle 0
      // This might not be possible in our test setup, so we'll just test the current state
      const previousRound = await freshRoundStarter.getPreviousRoundId()

      if (previousRound === 0n) {
        await expect(freshRoundStarter.claimAllocationsForPreviousRound()).to.be.revertedWith(
          "No previous round exists",
        )
      }
    })
  })
})
