import { ethers } from "hardhat"
import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import {
  getOrDeployContractInstances,
  getVot3Tokens,
  startNewAllocationRound,
  waitForRoundToEnd,
  waitForNextCycle,
} from "../../helpers"
import { endorseApp } from "../../helpers/xnodes"
import {
  XAllocationVoting,
  X2EarnApps,
  VeBetterPassport,
  VoterRewards,
  B3TR,
  Emissions,
  VOT3,
  RelayerRewardsPool,
  X2EarnCreator,
} from "../../../typechain-types"

describe("AutoVoting - @shard14b", function () {
  let xAllocationVoting: XAllocationVoting
  let x2EarnApps: X2EarnApps
  let veBetterPassport: VeBetterPassport
  let voterRewards: VoterRewards
  let b3tr: B3TR
  let emissions: Emissions
  let relayerRewardsPool: RelayerRewardsPool
  let vot3: VOT3
  let owner: HardhatEthersSigner
  let relayer1: HardhatEthersSigner
  let minterAccount: HardhatEthersSigner
  let otherAccounts: HardhatEthersSigner[]
  let user: HardhatEthersSigner
  let user1: HardhatEthersSigner
  let user2: HardhatEthersSigner
  let appOwner: HardhatEthersSigner
  let appOwner1: HardhatEthersSigner
  let appOwner2: HardhatEthersSigner
  let appOwner3: HardhatEthersSigner
  let x2EarnCreatorContract: X2EarnCreator

  // Main setup - used by most tests
  const setupContracts = async () => {
    const config = await getOrDeployContractInstances({
      forceDeploy: true,
    })
    if (!config) throw new Error("Failed to deploy contracts")

    xAllocationVoting = config.xAllocationVoting
    x2EarnApps = config.x2EarnApps
    veBetterPassport = config.veBetterPassport
    voterRewards = config.voterRewards
    b3tr = config.b3tr
    emissions = config.emissions
    vot3 = config.vot3
    owner = config.owner
    minterAccount = config.minterAccount
    otherAccounts = config.otherAccounts
    relayerRewardsPool = config.relayerRewardsPool
    relayer1 = otherAccounts[10]
    user = otherAccounts[0]
    user1 = otherAccounts[1]
    user2 = otherAccounts[2]
    appOwner = otherAccounts[11]
    appOwner1 = otherAccounts[12]
    appOwner2 = otherAccounts[13]
    appOwner3 = otherAccounts[14]
    x2EarnCreatorContract = config.x2EarnCreator

    await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

    await emissions.connect(minterAccount).bootstrap()
    await relayerRewardsPool.connect(owner).setRelayerFeePercentage(10)

    await veBetterPassport.toggleCheck(1)
    await veBetterPassport.whitelist(user.address)
    await veBetterPassport.whitelist(user1.address)
    await veBetterPassport.whitelist(user2.address)
    await getVot3Tokens(user, "100")
    await getVot3Tokens(user1, "100")
    await getVot3Tokens(user2, "100")
  }

  describe("Core logic", function () {
    beforeEach(async function () {
      await setupContracts()
      await emissions.connect(minterAccount).start()
    })

    it("should toggle autovoting status correctly", async function () {
      const initialCycle = await emissions.getCurrentCycle()
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(user.address))
      await x2EarnApps.connect(owner).submitApp(user.address, user.address, user.address, "metadataURI")
      await endorseApp(app1Id, user)
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Toggle auto-voting: ON, OFF, and ON
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.false

      // Wait for the next cycle to be distributable
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // =========== cycle 1 ===========
      const cycle1 = await emissions.getCurrentCycle()

      expect(Number(cycle1)).to.be.greaterThan(Number(initialCycle))
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id]) // The user must set his preferences again to be able to vote after autovoting is disabled
      expect(await xAllocationVoting.getUserVotingPreferences(user.address)).to.deep.equal([app1Id])
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.true
    })

    it("should set and get user voting preferences", async function () {
      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Set voting preferences first
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Enable autovoting
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

      // Get and verify preferences
      const preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])
    })

    it("revert when cast vote on behalf of user if autovoting is not enabled", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      const preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])

      await startNewAllocationRound()

      // cast vote on behalf of user
      await expect(xAllocationVoting.connect(owner).castVoteOnBehalfOf(user.address, 1)).to.be.revertedWithCustomError(
        xAllocationVoting,
        "AutoVotingNotEnabled",
      )
    })

    it("should clear preferences when autovoting is disabled", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Set preferences first then enable autovoting
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])
      await expect(xAllocationVoting.connect(user).toggleAutoVoting(user.address))
        .to.emit(xAllocationVoting, "AutoVotingToggled")
        .withArgs(user.address, true)

      // Verify preferences are set
      let preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])

      // Disable autovoting
      const txn = await xAllocationVoting.connect(user).toggleAutoVoting(user.address)
      await expect(txn).to.emit(xAllocationVoting, "AutoVotingToggled").withArgs(user.address, false)

      // Preferences should be cleared
      preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([])
    })

    it("should validate app preferences", async function () {
      // Should revert with empty apps array
      await expect(xAllocationVoting.connect(user).setUserVotingPreferences([])).to.be.revertedWith(
        "AutoVotingLogic: no apps to vote for",
      )

      // Should revert with invalid app
      const invalidAppId = ethers.keccak256(ethers.toUtf8Bytes("invalid"))
      await expect(xAllocationVoting.connect(user).setUserVotingPreferences([invalidAppId])).to.be.revertedWith(
        "AutoVotingLogic: invalid app",
      )
    })

    it("should count total auto-voting users", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(user.address))
      await x2EarnApps.connect(owner).submitApp(user.address, user.address, user.address, "metadataURI")
      await endorseApp(app1Id, user)

      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user1).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user2).setUserVotingPreferences([app1Id])

      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)
      await xAllocationVoting.connect(user1).toggleAutoVoting(user1.address)
      await xAllocationVoting.connect(user2).toggleAutoVoting(user2.address)

      // Still disabled until the next cycle
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.false
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user1.address)).to.be.false
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user2.address)).to.be.false
      expect(await xAllocationVoting.getTotalAutoVotingUsers()).to.equal(0)

      // Wait for the next cycle to be distributable
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.true
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user1.address)).to.be.true
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user2.address)).to.be.true
      expect(await xAllocationVoting.getTotalAutoVotingUsers()).to.equal(3)

      await xAllocationVoting.connect(user2).toggleAutoVoting(user2.address)
      // remaining 3 until the next cycle
      expect(await xAllocationVoting.getTotalAutoVotingUsers()).to.equal(3)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user2.address)).to.be.false
      expect(await xAllocationVoting.getTotalAutoVotingUsers()).to.equal(2)
    })

    it("should toggle off autovoting when transfer below 1 VOT3 when autovoting is enabled", async function () {
      const recipient = otherAccounts[3]

      // Create a test app
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      expect(await vot3.balanceOf(user.address)).to.equal(ethers.parseEther("100"))

      // Set preferences first then enable autovoting
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.false

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.true
      expect(await vot3.version()).to.equal("2")

      // Transfer 99.5 VOT3 which would leave user with 0.5 VOT3 (below 1 VOT3)
      // This should automatically toggle off autovoting and allow the transfer
      await vot3.connect(user).transfer(recipient.address, ethers.parseEther("99.5"))
      expect(await vot3.balanceOf(recipient.address)).to.equal(ethers.parseEther("99.5"))

      // Verify autovoting is now disabled (using current status, not round snapshot)
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false

      // Test multiple transfers with low balance - should NOT revert
      // Transfer 0.1 VOT3 more (user still has 0.4 VOT3, still below 1 VOT3)
      await vot3.connect(user).transfer(recipient.address, ethers.parseEther("0.1"))
      expect(await vot3.balanceOf(user.address)).to.equal(ethers.parseEther("0.4"))
      expect(await vot3.balanceOf(recipient.address)).to.equal(ethers.parseEther("99.6"))

      // Another transfer - should still work without reverting
      await vot3.connect(user).transfer(recipient.address, ethers.parseEther("0.1"))
      expect(await vot3.balanceOf(user.address)).to.equal(ethers.parseEther("0.3"))
      expect(await vot3.balanceOf(recipient.address)).to.equal(ethers.parseEther("99.7"))

      // Wait for next cycle for round snapshot to update
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // Verify autovoting is disabled in both current status and round snapshot
      expect(await xAllocationVoting.isUserAutoVotingEnabled(user.address)).to.be.false
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.false

      // Verify final balances
      expect(await vot3.balanceOf(user.address)).to.equal(ethers.parseEther("0.3"))
    })

    it("revert if app preferences are empty before enabling autovoting", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(user.address))
      await x2EarnApps.connect(owner).submitApp(user.address, user.address, user.address, "metadataURI")
      await endorseApp(app1Id, user)

      await expect(xAllocationVoting.connect(user).toggleAutoVoting(user.address)).to.be.revertedWith(
        "AutoVotingLogic: must select at least one app",
      )
    })

    it("should revert when user with auto-voting enabled tries to cast manual vote", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()
      const userBalance = await vot3.balanceOf(user.address)

      // User with auto-voting enabled tries to manually cast vote - should revert
      await expect(
        xAllocationVoting.connect(user).castVote(roundId, [app1Id], [userBalance]),
      ).to.be.revertedWithCustomError(xAllocationVoting, "AutoVotingEnabled")
    })

    it("should correctly handle auto-voting status when disabled mid-cycle", async function () {
      // Scenario:
      // Auto voting status
      // Initial cycle - OFF
      // Cycle 1 - ON (enabled during previous cycle)
      // Cycle 2 - OFF (disabled during cycle 1)
      // Cycle 3 - OFF (remains disabled)

      // Get initial cycle data
      const initialCycle = await emissions.getCurrentCycle()
      const initialEmissionBlock = await emissions.lastEmissionBlock()

      // Create a test app and set preferences first
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(user.address))
      await x2EarnApps.connect(owner).submitApp(user.address, user.address, user.address, "metadataURI")
      await endorseApp(app1Id, user)
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])

      // Enable auto-voting mid-cycle
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.false

      // Wait for the next cycle to be distributable
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // =========== cycle 1 ===========
      const cycle1 = await emissions.getCurrentCycle()
      const cycle1EmissionBlock = await emissions.lastEmissionBlock()

      expect(Number(cycle1)).to.be.greaterThan(Number(initialCycle))
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.true

      // User disables auto-voting mid-cycle
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

      // Wait for the next cycle
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // =========== cycle 2 ===========
      const cycle2 = await emissions.getCurrentCycle()
      const cycle2EmissionBlock = await emissions.lastEmissionBlock()

      expect(Number(cycle2)).to.be.greaterThan(Number(cycle1))
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.false

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // =========== cycle 3 ===========
      const cycle3 = await emissions.getCurrentCycle()
      const cycle3EmissionBlock = await emissions.lastEmissionBlock()

      // Verify cycle has advanced
      expect(Number(cycle3)).to.be.greaterThan(Number(cycle2))
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.false

      // It should be disabled at the start of the initial cycle
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, initialEmissionBlock)).to.be.false
      // It should be enabled at the start of cycle 1
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, cycle1EmissionBlock)).to.be.true
      // But it should still be disabled at the start of cycle 2
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, cycle2EmissionBlock)).to.be.false
      // Auto-voting should be disabled at the start of cycle 3
      expect(await xAllocationVoting.isUserAutoVotingEnabledAtTimepoint(user.address, cycle3EmissionBlock)).to.be.false
    })

    it("should revert when user tries to toggle autovoting when has no votes available", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      const user = otherAccounts[5]
      await veBetterPassport.whitelist(user.address)

      await expect(xAllocationVoting.connect(user).toggleAutoVoting(user.address)).to.be.revertedWith(
        "AutoVotingLogic: at least 1 VOT3 is required",
      )
    })

    it("should revert non-relayers from claiming rewards during early access period for auto-voting users", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await x2EarnApps
        .connect(owner)
        .submitApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      await endorseApp(app1Id, otherAccounts[0])

      await relayerRewardsPool.connect(owner).registerRelayer(relayer1.address)

      const manualUser = user
      const autoUser = user1
      const nonRelayer = otherAccounts[3]

      await veBetterPassport.whitelist(nonRelayer.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      await xAllocationVoting.connect(autoUser).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()

      const manualUserBalance = await vot3.balanceOf(manualUser.address)

      await xAllocationVoting.connect(manualUser).castVote(roundId, [app1Id], [manualUserBalance])
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser, roundId)
      await waitForRoundToEnd(roundId)

      // Manual user can be claimed by anyone
      await expect(voterRewards.connect(nonRelayer).claimReward(roundId, manualUser.address)).to.not.be.reverted

      // Early access period is still active
      expect(await relayerRewardsPool.isEarlyAccessActive(roundId)).to.be.true

      // Auto user cannot be claimed by non-relayer
      await expect(voterRewards.connect(nonRelayer).claimReward(roundId, autoUser.address)).to.be.revertedWith(
        "RelayerRewardsPool: caller is not a registered relayer during early access period",
      )

      // Auto user can be claimed by registered relayer during early access period
      await expect(voterRewards.connect(relayer1).claimReward(roundId, autoUser.address)).to.not.be.reverted
    })

    it("should allow auto-voting users to claim rewards for themselves after early access period", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await x2EarnApps
        .connect(owner)
        .submitApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      await endorseApp(app1Id, otherAccounts[0])

      await relayerRewardsPool.connect(owner).registerRelayer(relayer1.address)

      const autoUser = user1

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      await xAllocationVoting.connect(autoUser).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser).toggleAutoVoting(autoUser.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()

      // Cast auto vote
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser, roundId)
      await waitForRoundToEnd(roundId)

      // Set early access period to 5 blocks to make it expire quickly
      await relayerRewardsPool.connect(owner).setEarlyAccessBlocks(5)

      // Verify early access period has ended
      expect(await relayerRewardsPool.isEarlyAccessActive(roundId)).to.be.false

      // Auto user should now be able to claim their own rewards
      await expect(voterRewards.connect(autoUser).claimReward(roundId, autoUser.address)).to.not.be.reverted
    })
  })

  describe("castVoteOnBehalfOf function", function () {
    beforeEach(async function () {
      await setupContracts()

      // Give user voting power another 200
      const startingAmount = "200"
      await getVot3Tokens(user, startingAmount) // Now the user has 300 VOT3

      await emissions.connect(minterAccount).start()
      await relayerRewardsPool.connect(owner).registerRelayer(relayer1.address)
    })

    it("should successfully cast vote on behalf of user with single app", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()
      const tx = await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId)
      await expect(tx).to.not.be.reverted

      const hasVoted = await xAllocationVoting.hasVoted(roundId, user.address)
      expect(hasVoted).to.be.true
    })

    it("should successfully cast vote on behalf of user with multiple apps and distribute votes equally", async function () {
      await x2EarnCreatorContract.connect(owner).safeMint(appOwner1.address)
      await x2EarnCreatorContract.connect(owner).safeMint(appOwner2.address)
      await x2EarnCreatorContract.connect(owner).safeMint(appOwner3.address)

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner1.address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner2.address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner3.address))

      await x2EarnApps
        .connect(appOwner1)
        .submitApp(appOwner1.address, appOwner1.address, appOwner1.address, "metadataURI")
      await x2EarnApps
        .connect(appOwner2)
        .submitApp(appOwner2.address, appOwner2.address, appOwner2.address, "metadataURI")
      await x2EarnApps
        .connect(appOwner3)
        .submitApp(appOwner3.address, appOwner3.address, appOwner3.address, "metadataURI")

      await endorseApp(app1Id, appOwner1)
      await endorseApp(app2Id, appOwner2)
      await endorseApp(app3Id, appOwner3)

      // Set preferences first then enable autovoting for all apps
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id, app2Id, app3Id])
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()
      const tx = await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId)
      await expect(tx).to.not.be.reverted

      // Verify vote was cast
      const hasVoted = await xAllocationVoting.hasVoted(roundId, user.address)
      expect(hasVoted).to.be.true

      // Verify votes were distributed equally (100 VOT3 each)
      const expectedVotePerApp = ethers.parseEther("100")
      const app1Votes = await xAllocationVoting.getAppVotes(roundId, app1Id)
      const app2Votes = await xAllocationVoting.getAppVotes(roundId, app2Id)
      const app3Votes = await xAllocationVoting.getAppVotes(roundId, app3Id)

      expect(app1Votes).to.equal(expectedVotePerApp)
      expect(app2Votes).to.equal(expectedVotePerApp)
      expect(app3Votes).to.equal(expectedVotePerApp)
    })

    it("should successfully cast vote on behalf of user with 10 apps and distribute votes equally", async function () {
      const appIds: string[] = []
      const getAllSigners = await ethers.getSigners()
      const getAllAppOwners = getAllSigners.slice(5, 20)

      for (let i = 0; i < 15; i++) {
        const appOwner = getAllAppOwners[i]
        const isCreatorMinted = await x2EarnCreatorContract.balanceOf(appOwner.address)

        if (isCreatorMinted === 0n) {
          await x2EarnCreatorContract.connect(owner).safeMint(appOwner.address)
        }

        const appId = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
        await x2EarnApps
          .connect(appOwner)
          .submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")

        // Endorse the app
        await endorseApp(appId, appOwner)

        appIds.push(appId)
      }

      // Set preferences first then enable autovoting for all apps
      await xAllocationVoting.connect(user).setUserVotingPreferences(appIds)
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()
      const tx = await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId)
      await expect(tx).to.not.be.reverted

      // Verify vote was cast
      const hasVoted = await xAllocationVoting.hasVoted(roundId, user.address)
      expect(hasVoted).to.be.true

      // Verify votes were distributed equally (20 VOT3 each = 300 VOT3 total / 15 apps)
      const expectedVotePerApp = ethers.parseEther("20")
      for (const appId of appIds) {
        const votes = await xAllocationVoting.getAppVotes(roundId, appId)
        expect(votes).to.equal(expectedVotePerApp)
      }
    })

    it.skip("should show gas cost progression from 1 to 15 apps", async function () {
      /**
       * This test is for gas cost analysis.
       */
      const appIds: string[] = []
      const getAllSigners = await ethers.getSigners()
      const getAllAppOwners = getAllSigners.slice(5, 20)

      for (let i = 0; i < 15; i++) {
        const appOwner = getAllAppOwners[i]
        const isCreatorMinted = await x2EarnCreatorContract.balanceOf(appOwner.address)

        if (isCreatorMinted === 0n) {
          await x2EarnCreatorContract.connect(owner).safeMint(appOwner.address)
        }

        const appId = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
        await x2EarnApps
          .connect(appOwner)
          .submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")

        // Endorse the app
        await endorseApp(appId, appOwner)

        appIds.push(appId)
      }

      const gasResults: { appCount: number; gasUsed: bigint }[] = []

      // Enable autovoting once at the beginning (need to set preferences first)
      await xAllocationVoting.connect(user).setUserVotingPreferences([appIds[0]])
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // Test from 1 to 15 apps
      for (let appCount = 1; appCount <= 15; appCount++) {
        // Update voting preferences with apps 0 to appCount-1
        const currentAppIds = appIds.slice(0, appCount)
        await xAllocationVoting.connect(user).setUserVotingPreferences(currentAppIds)

        // Start new round
        const roundId = await xAllocationVoting.currentRoundId()

        // Cast vote and measure gas
        const tx = await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId)
        const receipt = await tx.wait()

        await expect(tx).to.not.be.reverted

        const gasUsed = receipt?.gasUsed || 0n
        gasResults.push({ appCount, gasUsed })

        console.log(`${appCount} apps: ${gasUsed.toLocaleString()} gas`)

        // Verify vote was cast
        const hasVoted = await xAllocationVoting.hasVoted(roundId, user.address)
        expect(hasVoted).to.be.true

        // Wait for round to end and start next round (except for last iteration)
        if (appCount < 15) {
          await waitForRoundToEnd(roundId)
          await startNewAllocationRound()
        }
      }
      // Calculate gas increase rate
      console.log("\n=== Gas Increase Analysis ===")
      for (let i = 1; i < gasResults.length; i++) {
        const prev = gasResults[i - 1]
        const curr = gasResults[i]
        const increase = Number(curr.gasUsed - prev.gasUsed)
        console.log(`${prev.appCount} → ${curr.appCount} apps: +${increase.toLocaleString()} gas`)
      }
    })

    it("should revert when voter is not a person", async function () {
      // User is non-person without whitelisted
      const user = otherAccounts[5]

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      await expect(xAllocationVoting.connect(user).toggleAutoVoting(user.address)).to.be.revertedWithCustomError(
        xAllocationVoting,
        "GovernorPersonhoodVerificationFailed",
      )
    })

    it("should revert when user has no app preferences set", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      // Try to enable autovoting but don't set preferences (should fail)
      await expect(xAllocationVoting.connect(user).toggleAutoVoting(user.address)).to.be.revertedWith(
        "AutoVotingLogic: must select at least one app",
      )
    })

    it("[Edge Case] should revert when the users have no eligible apps to vote for", async function () {
      await x2EarnCreatorContract.connect(owner).safeMint(appOwner.address)
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(appOwner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId = await xAllocationVoting.currentRoundId()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, roundId)).to.be.true

      // App gets unendorsed during round 1, but autovoting should still work
      const nodeId = 1
      await x2EarnApps.connect(appOwner).unendorseApp(app1Id, nodeId)
      expect(await x2EarnApps.isAppUnendorsed(app1Id)).to.eql(true)

      // Autovoting should still work since app is still eligible for current round
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId)).to.not.be.reverted

      // Fast forward through grace period...
      await waitForNextCycle(emissions)

      // Round 2 - still eligible (grace period)
      await emissions.connect(minterAccount).distribute()
      await x2EarnApps.checkEndorsement(app1Id)
      const roundId2 = await xAllocationVoting.currentRoundId()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, roundId2)).to.be.true

      // Round 3 - still eligible (grace period)
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()
      await x2EarnApps.checkEndorsement(app1Id)
      const roundId3 = await xAllocationVoting.currentRoundId()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, roundId3)).to.be.true

      // Round 4 - NOW app becomes ineligible
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()
      const roundId4 = await xAllocationVoting.currentRoundId()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, roundId4)).to.be.false

      // Autovoting should fail because no eligible apps
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId4))
        .to.emit(xAllocationVoting, "AutoVotingDisabled")
        .withArgs(user.address, roundId4)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // Verify user preferences were cleared and auto-voting is disabled
      expect(await xAllocationVoting.getUserVotingPreferences(user.address)).to.deep.equal([])
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.false
    })

    it("should filter out apps that become unendorsed during autovoting", async function () {
      await x2EarnCreatorContract.connect(owner).safeMint(appOwner.address)
      await x2EarnCreatorContract.connect(owner).safeMint(appOwner2.address)

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(appOwner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner2.address))
      await x2EarnApps
        .connect(appOwner2)
        .submitApp(appOwner2.address, appOwner2.address, appOwner2.address, "metadataURI")
      await endorseApp(app2Id, appOwner2)

      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id, app2Id])
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)

      // Start round 2 - app is eligible
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId2 = await xAllocationVoting.currentRoundId()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, roundId2)).to.be.true

      // App gets unendorsed during round 2, but autovoting should still work
      const nodeId = 1
      await x2EarnApps.connect(appOwner).unendorseApp(app1Id, nodeId)
      expect(await x2EarnApps.isAppUnendorsed(app1Id)).to.eql(true)

      // Autovoting should still work since app is still eligible for current round
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId2))
        .to.emit(xAllocationVoting, "AllocationAutoVoteCast")
        .withArgs(user.address, roundId2, [app1Id, app2Id], [ethers.parseEther("150"), ethers.parseEther("150")])

      // Fast forward through grace period...
      await waitForRoundToEnd(roundId2)

      // Round 3 - still eligible (grace period)
      await startNewAllocationRound()
      const roundId3 = await xAllocationVoting.currentRoundId()
      await x2EarnApps.checkEndorsement(app1Id)
      expect(await xAllocationVoting.isEligibleForVote(app1Id, roundId3)).to.be.true

      // Round 4 - still eligible (grace period)
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()
      const roundId4 = await xAllocationVoting.currentRoundId()
      await x2EarnApps.checkEndorsement(app1Id)
      expect(await xAllocationVoting.isEligibleForVote(app1Id, roundId4)).to.be.true

      // Round 5 - NOW app1 becomes ineligible but app2 is still eligible
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()
      const roundId5 = await xAllocationVoting.currentRoundId()
      expect(await xAllocationVoting.isEligibleForVote(app1Id, roundId5)).to.be.false
      expect(await xAllocationVoting.isEligibleForVote(app2Id, roundId5)).to.be.true

      // Autovoting should succeed because app2 is still eligible
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user.address, roundId5))
        .to.emit(xAllocationVoting, "AllocationAutoVoteCast")
        .withArgs(user.address, roundId5, [app2Id], [ethers.parseEther("300")])
    })

    it("should handle vote distribution with remaining dust correctly", async function () {
      // User1 has 100 VOT3 that doesn't divide evenly by 3 (100 / 3 = 33.33...)

      await x2EarnCreatorContract.connect(owner).safeMint(appOwner1.address)
      await x2EarnCreatorContract.connect(owner).safeMint(appOwner2.address)
      await x2EarnCreatorContract.connect(owner).safeMint(appOwner3.address)

      // Create test apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner1.address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner2.address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner3.address))

      await x2EarnApps
        .connect(appOwner1)
        .submitApp(appOwner1.address, appOwner1.address, appOwner1.address, "metadataURI")
      await x2EarnApps
        .connect(appOwner2)
        .submitApp(appOwner2.address, appOwner2.address, appOwner2.address, "metadataURI")
      await x2EarnApps
        .connect(appOwner3)
        .submitApp(appOwner3.address, appOwner3.address, appOwner3.address, "metadataURI")

      await endorseApp(app1Id, appOwner1)
      await endorseApp(app2Id, appOwner2)
      await endorseApp(app3Id, appOwner3)

      await xAllocationVoting.connect(user1).setUserVotingPreferences([app1Id, app2Id, app3Id])
      await xAllocationVoting.connect(user1).toggleAutoVoting(user1.address)

      // Start round
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // Cast vote on behalf of user
      const roundId2 = await xAllocationVoting.currentRoundId()
      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user1.address, roundId2)).to.not.be.reverted

      // Verify vote was cast
      const hasVoted = await xAllocationVoting.hasVoted(roundId2, user1.address)
      expect(hasVoted).to.be.true

      // // Verify votes were distributed (33 VOT3 each, 1 VOT3 dust remains)
      const app1Votes = await xAllocationVoting.getAppVotes(roundId2, app1Id)
      const app2Votes = await xAllocationVoting.getAppVotes(roundId2, app2Id)
      const app3Votes = await xAllocationVoting.getAppVotes(roundId2, app3Id)

      // All apps should get the same amount
      expect(app1Votes).to.equal(app2Votes)
      expect(app2Votes).to.equal(app3Votes)

      // Total distributed should be less than original (proving dust exists)
      const totalVotes = app1Votes + app2Votes + app3Votes
      const originalAmount = ethers.parseEther("100")
      expect(totalVotes).to.be.lessThan(originalAmount)

      // Each app should get roughly 33.33 ETH (but as integer division)
      const totalDistributed = app1Votes + app2Votes + app3Votes
      const dust = originalAmount - totalDistributed // 1 VOT3 dust
      expect(dust).to.equal(1)
    })
  })

  describe("Events", function () {
    beforeEach(async function () {
      await setupContracts()
      await emissions.connect(minterAccount).start()
    })

    it("should emit all autovoting events for single user complete flow", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(appOwner.address))
      await x2EarnApps.connect(owner).submitApp(appOwner.address, appOwner.address, appOwner.address, "metadataURI")
      await endorseApp(app1Id, appOwner)

      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.false
      expect(await xAllocationVoting.getUserVotingPreferences(user.address)).to.deep.equal([])

      await waitForNextCycle(emissions)
      const tx = await emissions.connect(minterAccount).distribute()
      await expect(tx).to.emit(emissions, "EmissionDistributedV2")

      await expect(relayerRewardsPool.connect(owner).registerRelayer(relayer1.address))
        .to.emit(relayerRewardsPool, "RelayerRegistered")
        .withArgs(relayer1.address)

      // Set preferences first
      await expect(xAllocationVoting.connect(user).setUserVotingPreferences([app1Id]))
        .to.emit(xAllocationVoting, "PreferredAppsUpdated")
        .withArgs(user.address, [app1Id])

      await expect(xAllocationVoting.connect(user).toggleAutoVoting(user.address))
        .to.emit(xAllocationVoting, "AutoVotingToggled")
        .withArgs(user.address, true)

      const preferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(preferences).to.deep.equal([app1Id])

      await waitForNextCycle(emissions)
      const tx2 = await emissions.connect(minterAccount).distribute()
      const round3 = await xAllocationVoting.currentRoundId()
      const totalAutoVotingUsers = 1
      const totalActions = 2
      const totalWeightedActions = 4
      const numRelayers = 1
      await expect(tx2)
        .to.emit(relayerRewardsPool, "TotalAutoVotingActionsSet")
        .withArgs(round3, totalAutoVotingUsers, totalActions, totalWeightedActions, numRelayers)

      const finalPreferences = await xAllocationVoting.getUserVotingPreferences(user.address)
      expect(await xAllocationVoting.isUserAutoVotingEnabledInCurrentRound(user.address)).to.be.true
      expect(finalPreferences).to.deep.equal([app1Id])

      await expect(xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user, round3))
        .to.emit(xAllocationVoting, "AllocationVoteCast")
        .withArgs(user.address, round3, [app1Id], [ethers.parseEther("100")])
        .to.emit(xAllocationVoting, "AllocationAutoVoteCast")
        .withArgs(user.address, round3, [app1Id], [ethers.parseEther("100")])
        .to.emit(relayerRewardsPool, "RelayerActionRegistered")
        .withArgs(relayer1.address, round3, 1, await relayerRewardsPool.getVoteWeight())

      /**
       * Since we only have 1 user participating, total rewards is 2M B3TR
       * Fee is 10% of rewards = 200,000 B3TR but with fee cap, it will be 100 B3TR
       * Actual rewards should be 1.9999M B3TR
       */
      const reward = await voterRewards.getReward(round3, user.address)
      const fee = await voterRewards.getFee(round3, user.address)
      expect(reward).to.equal(ethers.parseEther("1999900"))
      expect(fee).to.equal(ethers.parseEther("100")) // Fee cap is 100 B3TR

      expect(await relayerRewardsPool.claimableRewards(relayer1.address, round3)).to.equal(ethers.parseEther("0"))

      await waitForRoundToEnd(round3)

      await expect(voterRewards.connect(relayer1).claimReward(round3, user.address))
        .to.emit(voterRewards, "RewardClaimedV2")
        .withArgs(round3, user.address, reward, "0")
        .to.emit(relayerRewardsPool, "RelayerActionRegistered")
        .withArgs(relayer1.address, round3, 2, await relayerRewardsPool.getClaimWeight())
        .to.emit(relayerRewardsPool, "RewardsDeposited")
        .withArgs(round3, fee, await relayerRewardsPool.getTotalRewards(round3))

      expect(await relayerRewardsPool.totalActions(round3)).to.equal(2)
      expect(await relayerRewardsPool.completedWeightedActions(round3)).to.equal(
        await relayerRewardsPool.totalWeightedActions(round3),
      )
      expect(await relayerRewardsPool.completedWeightedActions(round3)).to.equal(
        await relayerRewardsPool.totalRelayerWeightedActions(relayer1.address, round3),
      )
    })
  })

  describe("Entire flow", function () {
    beforeEach(async function () {
      await setupContracts()
      await emissions.connect(minterAccount).start()

      await relayerRewardsPool.connect(owner).registerRelayer(relayer1.address)
    })

    it("should enable autovoting for multiple users", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await x2EarnApps
        .connect(owner)
        .submitApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      await endorseApp(app1Id, otherAccounts[0])

      expect(await b3tr.balanceOf(user.address)).to.equal(0)
      expect(await b3tr.balanceOf(user1.address)).to.equal(0)
      expect(await b3tr.balanceOf(user2.address)).to.equal(0)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // Set voting preferences for auto users first
      await xAllocationVoting.connect(user).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user1).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(user2).setUserVotingPreferences([app1Id])

      // Enable autovoting for auto users
      await xAllocationVoting.connect(user).toggleAutoVoting(user.address)
      await xAllocationVoting.connect(user1).toggleAutoVoting(user1.address)
      await xAllocationVoting.connect(user2).toggleAutoVoting(user2.address)

      // Start a new round
      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      // Vote via autovoting
      const roundId = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user, roundId)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user1, roundId)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(user2, roundId)

      await waitForRoundToEnd(roundId)

      // Check rewards
      const userReward = await voterRewards.getReward(roundId, user.address)
      const user1Reward = await voterRewards.getReward(roundId, user1.address)
      const user2Reward = await voterRewards.getReward(roundId, user2.address)

      expect(userReward).to.not.equal(0)
      expect(user1Reward).to.not.equal(0)
      expect(user2Reward).to.not.equal(0)

      await voterRewards.connect(relayer1).claimReward(roundId, user.address)
      await voterRewards.connect(relayer1).claimReward(roundId, user1.address)
      await voterRewards.connect(relayer1).claimReward(roundId, user2.address)

      expect(await b3tr.balanceOf(user.address)).to.not.equal(0)
      expect(await b3tr.balanceOf(user1.address)).to.not.equal(0)
      expect(await b3tr.balanceOf(user2.address)).to.not.equal(0)
      expect(await b3tr.balanceOf(await relayerRewardsPool.getAddress())).to.not.equal(0)
    })

    it("should work with manual and auto users", async function () {
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await x2EarnApps
        .connect(owner)
        .submitApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      await endorseApp(app1Id, otherAccounts[0])

      const manualUser1 = user
      const manualUser2 = user1
      const autoUser1 = user2
      const autoUser2 = otherAccounts[3]

      // Whitelist additional user
      await getVot3Tokens(autoUser2, "100")
      await veBetterPassport.whitelist(autoUser2.address)

      expect(await b3tr.balanceOf(manualUser1.address)).to.equal(0)
      expect(await b3tr.balanceOf(manualUser2.address)).to.equal(0)
      expect(await b3tr.balanceOf(autoUser1.address)).to.equal(0)
      expect(await b3tr.balanceOf(autoUser2.address)).to.equal(0)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      await xAllocationVoting.connect(autoUser1).setUserVotingPreferences([app1Id])
      await xAllocationVoting.connect(autoUser2).setUserVotingPreferences([app1Id])

      await xAllocationVoting.connect(autoUser1).toggleAutoVoting(autoUser1.address)
      await xAllocationVoting.connect(autoUser2).toggleAutoVoting(autoUser2.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId1 = await xAllocationVoting.currentRoundId()

      // Manual users vote manually
      const manualUser1Balance = await vot3.balanceOf(manualUser1.address)
      const manualUser2Balance = await vot3.balanceOf(manualUser2.address)

      await xAllocationVoting.connect(manualUser1).castVote(roundId1, [app1Id], [manualUser1Balance])
      await xAllocationVoting.connect(manualUser2).castVote(roundId1, [app1Id], [manualUser2Balance])

      // Auto users vote via autovoting
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser1, roundId1)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser2, roundId1)

      await waitForRoundToEnd(roundId1)

      // Check rewards before claiming
      const manualUser1R1 = await voterRewards.getReward(roundId1, manualUser1.address)
      const autoUser1R1 = await voterRewards.getReward(roundId1, autoUser1.address)

      expect(manualUser1R1).to.not.equal(0)
      expect(autoUser1R1).to.not.equal(0)

      await voterRewards.claimReward(roundId1, manualUser1.address)
      await voterRewards.claimReward(roundId1, manualUser2.address)
      await voterRewards.connect(relayer1).claimReward(roundId1, autoUser1.address)
      await voterRewards.connect(relayer1).claimReward(roundId1, autoUser2.address)

      await waitForNextCycle(emissions)
      await emissions.connect(minterAccount).distribute()

      const roundId2 = await xAllocationVoting.currentRoundId()

      // Manual users vote manually
      const manualUser1Balance2 = await vot3.balanceOf(manualUser1.address)
      const manualUser2Balance2 = await vot3.balanceOf(manualUser2.address)

      await xAllocationVoting.connect(manualUser1).castVote(roundId2, [app1Id], [manualUser1Balance2])
      await xAllocationVoting.connect(manualUser2).castVote(roundId2, [app1Id], [manualUser2Balance2])

      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser1, roundId2)
      await xAllocationVoting.connect(relayer1).castVoteOnBehalfOf(autoUser2, roundId2)

      await waitForRoundToEnd(roundId2)

      // Check Round 2 rewards
      const manualUser1R2 = await voterRewards.getReward(roundId2, manualUser1.address)
      const autoUser1R2 = await voterRewards.getReward(roundId2, autoUser1.address)

      expect(manualUser1R2).to.not.equal(0)
      expect(autoUser1R2).to.not.equal(0)

      // Claim Round 2 rewards and verify B3TR balances
      await voterRewards.claimReward(roundId2, manualUser1.address)
      await voterRewards.claimReward(roundId2, manualUser2.address)
      await voterRewards.connect(relayer1).claimReward(roundId2, autoUser1.address)
      await voterRewards.connect(relayer1).claimReward(roundId2, autoUser2.address)

      expect(await b3tr.balanceOf(manualUser1.address)).to.not.equal(0)
      expect(await b3tr.balanceOf(manualUser2.address)).to.not.equal(0)
      expect(await b3tr.balanceOf(autoUser1.address)).to.not.equal(0)
      expect(await b3tr.balanceOf(autoUser2.address)).to.not.equal(0)
      expect(await b3tr.balanceOf(await relayerRewardsPool.getAddress())).to.not.equal(0)
    })
  })
})
