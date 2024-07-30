import { ethers } from "hardhat"
import { expect } from "chai"
import {
  ZERO_ADDRESS,
  bootstrapAndStartEmissions,
  bootstrapEmissions,
  catchRevert,
  createProposalAndExecuteIt,
  filterEventsByName,
  getOrDeployContractInstances,
  getVot3Tokens,
  parseAppAddedEvent,
  startNewAllocationRound,
  waitForCurrentRoundToEnd,
  waitForRoundToEnd,
} from "./helpers"
import { describe, it } from "mocha"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { createNodeHolder, endorseApp } from "./helpers/xnodes"
import { time } from "@nomicfoundation/hardhat-network-helpers"
import { deployProxy, upgradeProxy } from "../scripts/helpers"
import { X2EarnApps, X2EarnAppsV1 } from "../typechain-types"

describe("X-Apps", function () {
  describe("Deployment", function () {
    it("Clock mode is set correctly", async function () {
      const { x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: true })
      expect(await x2EarnApps.CLOCK_MODE()).to.eql("mode=blocknumber&from=default")
    })
  })

  describe("Contract upgradeablity", () => {
    it("Cannot initialize twice", async function () {
      const config = createLocalConfig()
      const { x2EarnApps, vechainNodes } = await getOrDeployContractInstances({ forceDeploy: true })
      await catchRevert(x2EarnApps.initializeV2(config.XAPP_GRACE_PERIOD, await vechainNodes.getAddress()))
    })

    it("User with UPGRADER_ROLE should be able to upgrade the contract", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("X2EarnApps")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await x2EarnApps.getAddress())

      const UPGRADER_ROLE = await x2EarnApps.UPGRADER_ROLE()
      expect(await x2EarnApps.hasRole(UPGRADER_ROLE, owner.address)).to.eql(true)

      await expect(x2EarnApps.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await x2EarnApps.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Only user with UPGRADER_ROLE should be able to upgrade the contract", async function () {
      const { x2EarnApps, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("X2EarnApps")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await x2EarnApps.getAddress())

      const UPGRADER_ROLE = await x2EarnApps.UPGRADER_ROLE()
      expect(await x2EarnApps.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(x2EarnApps.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await x2EarnApps.getAddress())

      expect(newImplAddress.toUpperCase()).to.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.not.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Should return correct version of the contract", async () => {
      const { x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.version()).to.equal("2")
    })

    it("X2Earn Apps Info added pre contract upgrade should should be same after upgrade", async () => {
      const config = createLocalConfig()
      config.EMISSIONS_CYCLE_DURATION = 24
      const { timeLock, owner, otherAccounts, vechainNodes } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy X2EarnApps
      const x2EarnAppsV1 = (await deployProxy("X2EarnAppsV1", [
        "ipfs://",
        [await timeLock.getAddress(), owner.address],
        owner.address,
        owner.address,
      ])) as X2EarnAppsV1

      // Add app 1
      await x2EarnAppsV1
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
      // Add app 2
      await x2EarnAppsV1
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

      // start round using V1 contract
      await startNewAllocationRound()

      // Add app 3 during first round
      await x2EarnAppsV1
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, "My app #3", "metadataURI")

      const appsV1 = await x2EarnAppsV1.apps()

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // Upgrade X2EarnAppsV1 to X2EarnApps
      const x2EarnApps = (await upgradeProxy(
        "X2EarnAppsV1",
        "X2EarnApps",
        await x2EarnAppsV1.getAddress(),
        [config.XAPP_GRACE_PERIOD, await vechainNodes.getAddress()],
        {},
        2,
      )) as X2EarnApps

      // start new round
      await startNewAllocationRound()

      const appsV2 = await x2EarnApps.apps()

      expect(appsV1).to.eql(appsV2)
    })
    it("X2Earn Apps added pre contract upgrade should need endorsement after upgrade and should be in grace period", async () => {
      const config = createLocalConfig()
      config.EMISSIONS_CYCLE_DURATION = 24
      const {
        xAllocationVoting,
        x2EarnRewardsPool,
        xAllocationPool,
        timeLock,
        owner,
        vechainNodes,
        otherAccounts,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy X2EarnApps
      const x2EarnAppsV1 = (await deployProxy("X2EarnAppsV1", [
        "ipfs://",
        [await timeLock.getAddress(), owner.address],
        owner.address,
        owner.address,
      ])) as X2EarnAppsV1

      await x2EarnRewardsPool.setX2EarnApps(await x2EarnAppsV1.getAddress())
      await xAllocationPool.setX2EarnAppsAddress(await x2EarnAppsV1.getAddress())
      await xAllocationVoting.setX2EarnAppsAddress(await x2EarnAppsV1.getAddress())

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes("My app #3"))

      // Create two MjolnirX node holder with an endorsement score of 100
      await createNodeHolder(7, otherAccounts[1]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100
      await createNodeHolder(7, otherAccounts[2]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100

      // Add apps -> should be eligble for next round
      await x2EarnAppsV1
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
      await x2EarnAppsV1
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

      // start round using V1 contract
      const round1 = await startNewAllocationRound()

      // Add app -> should be eligble for next round
      await x2EarnAppsV1
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, "My app #3", "metadataURI")

      // check eligibilty
      expect(await x2EarnAppsV1.isEligibleNow(app1Id)).to.eql(true)
      expect(await x2EarnAppsV1.isEligibleNow(app2Id)).to.eql(true)
      expect(await x2EarnAppsV1.isEligibleNow(app3Id)).to.eql(true)

      expect(await xAllocationVoting.isEligibleForVote(app1Id, round1)).to.eql(true)
      expect(await xAllocationVoting.isEligibleForVote(app2Id, round1)).to.eql(true)
      expect(await xAllocationVoting.isEligibleForVote(app3Id, round1)).to.eql(false)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // Upgrade X2EarnAppsV1 to X2EarnApps
      const x2EarnAppsV2 = (await upgradeProxy(
        "X2EarnAppsV1",
        "X2EarnApps",
        await x2EarnAppsV1.getAddress(),
        [config.XAPP_GRACE_PERIOD, await vechainNodes.getAddress()],
        {},
        2,
      )) as X2EarnApps

      // start new round
      const round2 = await startNewAllocationRound()

      // check eligibilty
      expect(await x2EarnAppsV2.isEligibleNow(app1Id)).to.eql(true)
      expect(await x2EarnAppsV2.isEligibleNow(app2Id)).to.eql(true)
      expect(await x2EarnAppsV2.isEligibleNow(app3Id)).to.eql(true)

      // All apps should be eligible now
      expect(await xAllocationVoting.isEligibleForVote(app1Id, round2)).to.eql(true)
      expect(await xAllocationVoting.isEligibleForVote(app2Id, round2)).to.eql(true)
      expect(await xAllocationVoting.isEligibleForVote(app3Id, round2)).to.eql(true)

      // Need to check the status of the apps so that they SC will reconise apps are unendrosed
      await x2EarnAppsV2.checkEndorsement(app1Id)
      await x2EarnAppsV2.checkEndorsement(app2Id)
      await x2EarnAppsV2.checkEndorsement(app3Id)

      // All apps should be seeking endorsement
      expect(await x2EarnAppsV2.appPendingEndorsment(app1Id)).to.eql(true)
      expect(await x2EarnAppsV2.appPendingEndorsment(app2Id)).to.eql(true)
      expect(await x2EarnAppsV2.appPendingEndorsment(app3Id)).to.eql(true)

      // 2 out of the three apps get endorsed
      await x2EarnAppsV2.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 100
      await x2EarnAppsV2.connect(otherAccounts[2]).endorseApp(app2Id) // Node holder endorsement score is 100

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // Need to check the status of the apps so that they SC will reconise apps are unendrosed ans track grace period
      await x2EarnAppsV2.checkEndorsement(app1Id)
      await x2EarnAppsV2.checkEndorsement(app2Id)
      await x2EarnAppsV2.checkEndorsement(app3Id)

      // start new round
      const round3 = await startNewAllocationRound()

      // All apps should be eligible now
      expect(await xAllocationVoting.isEligibleForVote(app1Id, round3)).to.eql(true)
      expect(await xAllocationVoting.isEligibleForVote(app2Id, round3)).to.eql(true)
      expect(await xAllocationVoting.isEligibleForVote(app3Id, round3)).to.eql(true)

      // Only 1 app should be seeking endorsement
      expect(await x2EarnAppsV2.appPendingEndorsment(app1Id)).to.eql(false)
      expect(await x2EarnAppsV2.appPendingEndorsment(app2Id)).to.eql(false)
      expect(await x2EarnAppsV2.appPendingEndorsment(app3Id)).to.eql(true)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // Need to check the status of the apps so that they SC will reconise apps are unendrosed and track grace period
      await x2EarnAppsV2.checkEndorsement(app1Id)
      await x2EarnAppsV2.checkEndorsement(app2Id)
      await x2EarnAppsV2.checkEndorsement(app3Id)

      // start new round -> app3Id has had two rounds unendorsed so it is no longer in grace period an dnot eligeble for voting
      const round4 = await startNewAllocationRound()

      // All apps should be eligible now
      expect(await xAllocationVoting.isEligibleForVote(app1Id, round4)).to.eql(true)
      expect(await xAllocationVoting.isEligibleForVote(app2Id, round4)).to.eql(true)
      expect(await xAllocationVoting.isEligibleForVote(app3Id, round4)).to.eql(false)

      // Only 1 app should be seeking endorsement
      expect(await x2EarnAppsV2.appPendingEndorsment(app1Id)).to.eql(false)
      expect(await x2EarnAppsV2.appPendingEndorsment(app2Id)).to.eql(false)
      expect(await x2EarnAppsV2.appPendingEndorsment(app3Id)).to.eql(true)
    })
  })

  describe("Settings", function () {
    it("Admin can set baseURI for apps", async function () {
      const { owner, x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: true })

      const initialURI = await x2EarnApps.baseURI()

      await x2EarnApps.connect(owner).setBaseURI("ipfs2://")

      const updatedURI = await x2EarnApps.baseURI()
      expect(updatedURI).to.eql("ipfs2://")
      expect(updatedURI).to.not.eql(initialURI)
    })

    it("Limit of 100 moderators and distributors is set", async function () {
      const { x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await x2EarnApps.MAX_MODERATORS()).to.eql(100n)
      expect(await x2EarnApps.MAX_REWARD_DISTRIBUTORS()).to.eql(100n)
    })
  })

  describe("Add apps", function () {
    it("Should be able to register an app successfully", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      let tx = await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let appAdded = filterEventsByName(receipt.logs, "AppAdded")
      expect(appAdded).not.to.eql([])

      let { id, address } = await parseAppAddedEvent(appAdded[0])
      expect(id).to.eql(app1Id)
      expect(address).to.eql(otherAccounts[0].address)
    })

    it("Should not be able to register an app if it is already registered", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      await catchRevert(
        x2EarnApps
          .connect(owner)
          .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI"),
      )
    })

    it("Should be able to fetch app team wallet address", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

      const app1ReceiverAddress = await x2EarnApps.teamWalletAddress(app1Id)
      const app2ReceiverAddress = await x2EarnApps.teamWalletAddress(app2Id)
      expect(app1ReceiverAddress).to.eql(otherAccounts[2].address)
      expect(app2ReceiverAddress).to.eql(otherAccounts[3].address)
    })

    it("Cannot register an app that has ZERO address as the team wallet address", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(
        x2EarnApps.connect(owner).registerApp(ZERO_ADDRESS, otherAccounts[2].address, "My app", "metadataURI"),
      )
    })

    it("Cannot register an app that has ZERO address as the admin", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(
        x2EarnApps.connect(owner).registerApp(otherAccounts[2].address, ZERO_ADDRESS, "My app", "metadataURI"),
      )
    })
  })

  describe("Fetch apps", function () {
    it("Can get eligible apps count", async function () {
      const { x2EarnApps, otherAccounts, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await endorseApp(app1Id, owner)

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, "My app #2", "metadataURI")

      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await endorseApp(app2Id, otherAccount)

      const appsCount = await x2EarnApps.appsCount()
      expect(appsCount).to.eql(2n)
    })

    it("Can get unendorsed app ids", async function () {
      const { x2EarnApps, otherAccounts, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const apps = await x2EarnApps.appIdsPendingEndorsement()
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, "My app #2", "metadataURI")
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))

      // unendorsed apps
      const appIds = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIds).to.eql([app1Id, app2Id])

      // endorsed apps
      const appsCount = await x2EarnApps.appsCount()
      expect(appsCount).to.eql(0n)
    })

    it("Can retrieve app by id", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const app = await x2EarnApps.app(app1Id)
      expect(app.id).to.eql(app1Id)
      expect(app.teamWalletAddress).to.eql(otherAccounts[0].address)
      expect(app.name).to.eql("My app")
      expect(app.metadataURI).to.eql("metadataURI")
    })

    it("Can index endorsed apps", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await endorseApp(app1Id, otherAccounts[0])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, "My app #2", "metadataURI")

      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await endorseApp(app2Id, otherAccounts[1])

      const apps = await x2EarnApps.apps()
      expect(apps.length).to.eql(2)
    })

    it("Can index unendorsed apps", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, "My app #2", "metadataURI")

      const apps = await x2EarnApps.appsPendingEndorsement()
      expect(apps.length).to.eql(2)
    })

    it("Can paginate apps", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await endorseApp(app1Id, otherAccounts[0])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, "My app #2", "metadataURI")
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await endorseApp(app2Id, otherAccounts[1])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[2].address, otherAccounts[2].address, "My app #3", "metadataURI")
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes("My app #3"))
      await endorseApp(app3Id, otherAccounts[2])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[3].address, otherAccounts[3].address, "My app #4", "metadataURI")
      const app4Id = ethers.keccak256(ethers.toUtf8Bytes("My app #4"))
      await endorseApp(app4Id, otherAccounts[3])

      const apps1 = await x2EarnApps.getPaginatedApps(0, 2)
      expect(apps1.length).to.eql(2)

      const apps2 = await x2EarnApps.getPaginatedApps(2, 5)
      expect(apps2.length).to.eql(2)

      expect(apps1).to.not.eql(apps2)

      const allApps = await x2EarnApps.getPaginatedApps(0, 4)
      expect(allApps).to.eql([...apps1, ...apps2])
    })

    it("Can get number of apps", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await endorseApp(app1Id, otherAccounts[0])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, "My app #2", "metadataURI")
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await endorseApp(app2Id, otherAccounts[1])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[2].address, otherAccounts[2].address, "My app #3", "metadataURI")
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes("My app #3"))
      await endorseApp(app3Id, otherAccounts[2])

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[3].address, otherAccounts[3].address, "My app #4", "metadataURI")
      const app4Id = ethers.keccak256(ethers.toUtf8Bytes("My app #4"))
      await endorseApp(app4Id, otherAccounts[3])

      const count = await x2EarnApps.appsCount()
      expect(count).to.eql(4n)

      const apps = await x2EarnApps.getPaginatedApps(0, 4)
      expect(apps.length).to.eql(4)

      await expect(x2EarnApps.getPaginatedApps(4, 4)).to.revertedWithCustomError(x2EarnApps, "X2EarnInvalidStartIndex")
    })

    it("Can fetch up to 1000 apps without pagination", async function () {
      console.log("Test disabled")

      // const { x2EarnApps, otherAccounts, owner, xAllocationVoting } = await getOrDeployContractInstances({
      //   forceDeploy: true,
      // })

      // const limit = 1000

      // let registerAppsPromises = []
      // for (let i = 1; i <= limit; i++) {
      //   registerAppsPromises.push(
      //     x2EarnApps
      //       .connect(owner)
      //       .registerApp(otherAccounts[1].address, otherAccounts[1].address, "My app" + i, "metadataURI"),
      //   )
      //   const appId = ethers.keccak256(ethers.toUtf8Bytes("My app" + i))
      //   await endorseApp(appId, otherAccounts[i])
      // }

      // await Promise.all(registerAppsPromises)

      // const apps = await x2EarnApps.apps()
      // expect(apps.length).to.eql(limit)

      // // check that can correctly fetch apps in round
      // await startNewAllocationRound()
      // const appsInRound = await xAllocationVoting.getAppsOfRound(1)
      // expect(appsInRound.length).to.eql(limit)
    })
  })

  describe("App availability for allocation voting", function () {
    it("Should be possible to endorse an app and make it available for allocation voting", async function () {
      const { x2EarnApps, xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(appId, otherAccounts[0])

      let roundId = await startNewAllocationRound()

      const isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, roundId)
      expect(isEligibleForVote).to.eql(true)
    })

    it("Admin can make an app unavailable for allocation voting starting from next round", async function () {
      const { xAllocationVoting, x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      await endorseApp(app1Id, otherAccounts[0])

      let round1 = await startNewAllocationRound()

      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, false)

      // app should still be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      let appsVotedInSpecificRound = await xAllocationVoting.getAppIdsOfRound(round1)
      expect(appsVotedInSpecificRound.length).to.equal(1n)

      await waitForRoundToEnd(round1)
      let round2 = await startNewAllocationRound()

      // app should not be eligible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)

      appsVotedInSpecificRound = await xAllocationVoting.getAppIdsOfRound(round2)
      expect(appsVotedInSpecificRound.length).to.equal(0)

      // if checking for the previous round, it should still be eligible
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)
    })

    it("Admin with governance role can make an unavailable app available again starting from next round", async function () {
      const { xAllocationVoting, x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(appId, otherAccounts[0])

      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(true)
      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, false)
      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(false)

      let round1 = await startNewAllocationRound()

      // app should still be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(false)

      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, true)
      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(true)
      expect(await x2EarnApps.isEligible(app1Id, await xAllocationVoting.roundSnapshot(round1))).to.eql(false)

      // app still should not be eligible from this round
      expect(await xAllocationVoting.isEligibleForVote(app1Id, round1)).to.eql(false)

      await waitForRoundToEnd(round1)

      let round2 = await startNewAllocationRound()

      // app should be eligible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(true)
    })

    it("Non existing app is not eligible", async function () {
      const { xAllocationVoting, x2EarnApps, owner, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      expect(await x2EarnApps.isEligibleNow(appId)).to.eql(false)
      expect(await x2EarnApps.isEligible(appId, (await xAllocationVoting.clock()) - 1n)).to.eql(false)
    })

    it("Non endorsed app is not eligible", async function () {
      const { xAllocationVoting, x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: true })

      const app1Id = await x2EarnApps.hashAppName(ZERO_ADDRESS)

      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(false)
      expect(await x2EarnApps.isEligible(app1Id, (await xAllocationVoting.clock()) - 1n)).to.eql(false)
    })

    it("Cannot get eligilibity in the future", async function () {
      const { xAllocationVoting, x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(appId, otherAccounts[0])

      await expect(x2EarnApps.isEligible(app1Id, (await xAllocationVoting.clock()) + 1n)).to.be.reverted
    })

    it("DAO can make an app unavailable for allocation voting starting from next round", async function () {
      const { otherAccounts, x2EarnApps, xAllocationVoting, emissions, timeLock, owner } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      await bootstrapAndStartEmissions()

      const app1Id = await x2EarnApps.hashAppName("Bike 4 Life")
      const proposer = otherAccounts[0]
      const voter1 = otherAccounts[1]

      // check that app does not exists
      await expect(x2EarnApps.app(app1Id)).to.be.reverted

      // granting role to the timelock
      await x2EarnApps.grantRole(await x2EarnApps.GOVERNANCE_ROLE(), await timeLock.getAddress())

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "Bike 4 Life", "metadataURI")
      await endorseApp(app1Id, otherAccounts[0])

      await waitForCurrentRoundToEnd()

      // start new round
      await emissions.distribute()
      let round1 = await xAllocationVoting.currentRoundId()
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await waitForCurrentRoundToEnd()

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        x2EarnApps,
        await ethers.getContractFactory("X2EarnApps"),
        "Exclude app from the allocation voting rounds",
        "setVotingEligibility",
        [app1Id, false],
      )

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await waitForCurrentRoundToEnd()

      await emissions.distribute()
      let round2 = await xAllocationVoting.currentRoundId()

      // app should not be eligible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)
    })

    it("Non-admin address cannot make an app available or unavailable for allocation voting", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: false })

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), otherAccounts[0].address)).to.eql(false)

      await catchRevert(x2EarnApps.connect(otherAccounts[0]).setVotingEligibility(app1Id, true))
    })

    it("App needs to wait next round if endorsed during an ongoing round", async function () {
      const { otherAccounts, x2EarnApps, owner, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      const voter = otherAccounts[0]
      await getVot3Tokens(voter, "30000")

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      let round1 = await startNewAllocationRound()

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      await endorseApp(appId, otherAccounts[0])
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(false)

      //check that I cannot vote for this app in current round
      await catchRevert(xAllocationVoting.connect(voter).castVote(round1, [app1Id], [ethers.parseEther("1")]))

      let appVotes = await xAllocationVoting.getAppVotes(round1, app1Id)
      expect(appVotes).to.equal(0n)

      let appsVotedInSpecificRound = await xAllocationVoting.getAppIdsOfRound(round1)
      expect(appsVotedInSpecificRound.length).to.equal(0)

      await waitForRoundToEnd(round1)
      let round2 = await startNewAllocationRound()

      // app should not be eligible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(true)

      // check that I can vote for this app
      expect(await xAllocationVoting.connect(voter).castVote(round2, [app1Id], [ethers.parseEther("1")])).to.not.be
        .reverted

      appVotes = await xAllocationVoting.getAppVotes(round2, app1Id)
      expect(appVotes).to.equal(ethers.parseEther("1"))
    })

    it("Cannot set Eligibility for non existing app", async function () {
      const { x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: true })

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await catchRevert(x2EarnApps.setVotingEligibility(app1Id, true))
    })
  })

  describe("Admin address", function () {
    it("Admin can update the admin address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const admin = await x2EarnApps.appAdmin(app1Id)
      expect(admin).to.eql(otherAccounts[0].address)

      await x2EarnApps.connect(owner).setAppAdmin(app1Id, otherAccounts[1].address)

      const updatedAdmin = await x2EarnApps.appAdmin(app1Id)
      expect(updatedAdmin).to.eql(otherAccounts[1].address)
      expect(updatedAdmin).to.not.eql(admin)
    })

    it("Cannot update the admin address of a non-existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const newAdminAddress = ethers.Wallet.createRandom().address

      await expect(x2EarnApps.connect(owner).setAppAdmin(app1Id, newAdminAddress)).to.be.rejected
    })

    it("Cannot set the admin address of an app to ZERO address", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await catchRevert(x2EarnApps.connect(otherAccounts[0]).setAppAdmin(app1Id, ZERO_ADDRESS))
    })

    it("User with DEFAULT_ADMIN_ROLE can update the admin address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const admin = await x2EarnApps.appAdmin(app1Id)
      expect(admin).to.eql(otherAccounts[0].address)

      await x2EarnApps.connect(otherAccounts[0]).setAppAdmin(app1Id, otherAccounts[1].address)

      const updatedAdmin = await x2EarnApps.appAdmin(app1Id)
      expect(updatedAdmin).to.eql(otherAccounts[1].address)
      expect(updatedAdmin).to.not.eql(admin)
    })

    it("Non admins cannot update the admin address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      // check that is not admin
      expect(await x2EarnApps.isAppAdmin(app1Id, otherAccounts[1].address)).to.eql(false)
      await catchRevert(x2EarnApps.connect(otherAccounts[1]).setAppAdmin(app1Id, otherAccounts[1].address))

      // user without DEFAULT_ADMIN_ROLE
      expect(await x2EarnApps.hasRole(await x2EarnApps.DEFAULT_ADMIN_ROLE(), otherAccounts[0].address)).to.eql(false)
      await catchRevert(x2EarnApps.connect(otherAccounts[1]).setAppAdmin(app1Id, otherAccounts[2].address))
    })
  })

  describe("Apps metadata", function () {
    it("Admin should be able to update baseURI", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const newBaseURI = "ipfs://new-base-uri"
      await x2EarnApps.connect(owner).setBaseURI(newBaseURI)
      expect(await x2EarnApps.baseURI()).to.eql(newBaseURI)
    })

    it("Non-admin should not be able to update baseURI", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })
      await catchRevert(x2EarnApps.connect(otherAccounts[0]).setBaseURI("ipfs://new-base-uri"))
    })

    it("Should be able to fetch app metadata", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const baseURI = await x2EarnApps.baseURI()
      const appURI = await x2EarnApps.appURI(app1Id)

      expect(appURI).to.eql(baseURI + "metadataURI")
    })

    it("Admin role can update app metadata", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const newMetadataURI = "metadataURI2"
      await x2EarnApps.connect(owner).updateAppMetadata(app1Id, newMetadataURI)

      const appURI = await x2EarnApps.appURI(app1Id)
      expect(appURI).to.eql((await x2EarnApps.baseURI()) + newMetadataURI)
    })

    it("Admin of app can update app metadata", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await x2EarnApps.connect(owner).registerApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      const newMetadataURI = "metadataURI2"
      await x2EarnApps.connect(appAdmin).updateAppMetadata(app1Id, newMetadataURI)

      const appURI = await x2EarnApps.appURI(app1Id)
      expect(appURI).to.eql((await x2EarnApps.baseURI()) + newMetadataURI)
    })

    it("Moderator can update app metadata", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      const appModerator = otherAccounts[10]
      await x2EarnApps.connect(owner).registerApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      await x2EarnApps.connect(appAdmin).addAppModerator(app1Id, appModerator.address)
      expect(await x2EarnApps.isAppModerator(app1Id, appModerator.address)).to.be.true

      const newMetadataURI = "metadataURI2"
      await x2EarnApps.connect(appModerator).updateAppMetadata(app1Id, newMetadataURI)

      const appURI = await x2EarnApps.appURI(app1Id)
      expect(appURI).to.eql((await x2EarnApps.baseURI()) + newMetadataURI)
    })

    it("Unatuhtorized users cannot update app metadata", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      const unauthorizedUser = otherAccounts[8]
      const oldMetadataURI = "metadataURI"
      await x2EarnApps.connect(owner).registerApp(otherAccounts[0].address, appAdmin.address, "My app", oldMetadataURI)

      const newMetadataURI = "metadataURI2"
      await expect(x2EarnApps.connect(unauthorizedUser).updateAppMetadata(app1Id, newMetadataURI)).to.be.rejected

      const appURI = await x2EarnApps.appURI(app1Id)
      expect(appURI).to.eql((await x2EarnApps.baseURI()) + oldMetadataURI)
    })

    it("Cannot update metadata of non existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const newMetadataURI = "metadataURI2"

      await expect(x2EarnApps.connect(owner).updateAppMetadata(app1Id, newMetadataURI)).to.be.rejected
    })

    it("Cannot get app uri of non existing app", async function () {
      const { x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await expect(x2EarnApps.appURI(app1Id)).to.be.rejected
    })
  })

  describe("Team wallet address", function () {
    it("Should be able to fetch app team wallet address", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const teamWalletAddress = await x2EarnApps.teamWalletAddress(app1Id)
      expect(teamWalletAddress).to.eql(otherAccounts[0].address)
    })

    it("Governance admin role can update the team wallet address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.teamWalletAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await x2EarnApps.connect(owner).updateTeamWalletAddress(app1Id, otherAccounts[1].address)

      const appReceiverAddress2 = await x2EarnApps.teamWalletAddress(app1Id)
      expect(appReceiverAddress2).to.eql(otherAccounts[1].address)
      expect(appReceiverAddress1).to.not.eql(appReceiverAddress2)
    })

    it("App admin can update the team wallet address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await x2EarnApps.connect(owner).registerApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.teamWalletAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, appAdmin.address)
      expect(isAdmin).to.be.false

      expect(await x2EarnApps.isAppAdmin(app1Id, appAdmin.address)).to.be.true

      await x2EarnApps.connect(appAdmin).updateTeamWalletAddress(app1Id, otherAccounts[1].address)

      const appReceiverAddress2 = await x2EarnApps.teamWalletAddress(app1Id)
      expect(appReceiverAddress2).to.eql(otherAccounts[1].address)
      expect(appReceiverAddress1).to.not.eql(appReceiverAddress2)
    })

    it("Moderators cannot update the team wallet address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.teamWalletAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await expect(x2EarnApps.connect(otherAccounts[1]).updateTeamWalletAddress(app1Id, otherAccounts[1].address)).to.be
        .rejected

      const appReceiverAddress2 = await x2EarnApps.teamWalletAddress(app1Id)
      expect(appReceiverAddress2).to.eql(appReceiverAddress1)
    })

    it("Moderators cannot update the team wallet address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.teamWalletAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await expect(x2EarnApps.connect(otherAccounts[1]).updateTeamWalletAddress(app1Id, otherAccounts[1].address)).to.be
        .rejected

      const appReceiverAddress2 = await x2EarnApps.teamWalletAddress(app1Id)
      expect(appReceiverAddress2).to.eql(appReceiverAddress1)
    })

    it("Non-admin cannot update the team wallet address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.teamWalletAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, otherAccounts[1].address)
      expect(isAdmin).to.be.false

      await expect(x2EarnApps.connect(otherAccounts[1]).updateTeamWalletAddress(app1Id, otherAccounts[1].address)).to.be
        .rejected

      const appReceiverAddress2 = await x2EarnApps.teamWalletAddress(app1Id)
      expect(appReceiverAddress2).to.eql(appReceiverAddress1)
    })

    it("Cannot update the team wallet address of a non-existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const newTeamWalletAddress = ethers.Wallet.createRandom().address

      await expect(x2EarnApps.connect(owner).updateTeamWalletAddress(app1Id, newTeamWalletAddress)).to.be.rejected
    })

    it("Team wallet address cannot be updated to ZERO address", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await catchRevert(x2EarnApps.connect(otherAccounts[0]).updateTeamWalletAddress(app1Id, ZERO_ADDRESS))
    })
  })

  describe("App Moderators", function () {
    it("By default there is no moderator for an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[0].address)
      expect(isModerator).to.be.false

      const moderators = await x2EarnApps.appModerators(app1Id)
      expect(moderators).to.eql([])
    })

    it("DEFAULT_ADMIN_ROLE can add a moderator to an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true
    })

    it("DEFAULT_ADMIN_ROLE can remove a moderator from an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      let isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await x2EarnApps.connect(owner).removeAppModerator(app1Id, otherAccounts[1].address)

      isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.false
    })

    it("App admin can add a moderator to an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await x2EarnApps.connect(owner).registerApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, appAdmin.address)
      expect(isAdmin).to.be.false

      expect(await x2EarnApps.isAppAdmin(app1Id, appAdmin.address)).to.be.true

      await x2EarnApps.connect(appAdmin).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true
    })

    it("App admin can remove a moderator from an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await x2EarnApps.connect(owner).registerApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")
      await x2EarnApps.connect(appAdmin).addAppModerator(app1Id, otherAccounts[1].address)
      await x2EarnApps.connect(appAdmin).addAppModerator(app1Id, otherAccounts[2].address)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, appAdmin.address)
      expect(isAdmin).to.be.false

      expect(await x2EarnApps.isAppAdmin(app1Id, appAdmin.address)).to.be.true

      let isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await x2EarnApps.connect(appAdmin).removeAppModerator(app1Id, otherAccounts[2].address)

      isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[2].address)
      expect(isModerator).to.be.false

      expect(await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)).to.be.true
    })

    it("Can correctly fetch all moderators of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)
      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[2].address)

      const moderators = await x2EarnApps.appModerators(app1Id)
      expect(moderators).to.eql([otherAccounts[1].address, otherAccounts[2].address])
    })

    it("Can know if an address is a moderator of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      let isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[2].address)
      expect(isModerator).to.be.false
    })

    it("Cannot add a moderator to a non-existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await expect(x2EarnApps.connect(owner).addAppModerator(app1Id, owner.address)).to.be.rejected
    })

    it("Cannot remove a moderator from a non-existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await expect(x2EarnApps.connect(owner).removeAppModerator(app1Id, owner.address)).to.be.rejected
    })

    it("Cannot add ZERO_ADDRESS as a moderator of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await expect(x2EarnApps.connect(otherAccounts[0]).addAppModerator(app1Id, ZERO_ADDRESS)).to.be.rejected
    })

    it("Cannot remove ZERO_ADDRESS as a moderator of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await expect(x2EarnApps.connect(otherAccounts[0]).removeAppModerator(app1Id, ZERO_ADDRESS)).to.be.rejected
    })

    it("Non admin or user without DEFAULT_ADMIN_ROLE cannot add a moderator to an app", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await expect(x2EarnApps.connect(otherAccounts[0]).addAppModerator(app1Id, otherAccounts[0].address)).to.be
        .rejected
    })

    it("Non admin or user without DEFAULT_ADMIN_ROLE cannot remove a moderator from an app", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await expect(x2EarnApps.connect(otherAccounts[0]).removeAppModerator(app1Id, otherAccounts[0].address)).to.be
        .rejected
    })

    it("Removing a moderator from an app does not affect other moderators of the app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)
      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[2].address)

      let isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[2].address)
      expect(isModerator).to.be.true

      await x2EarnApps.connect(owner).removeAppModerator(app1Id, otherAccounts[1].address)

      isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.false

      isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[2].address)
      expect(isModerator).to.be.true
    })

    it("An error is thrown when trying to remove a non existing moderator from an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await expect(x2EarnApps.connect(owner).removeAppModerator(app1Id, otherAccounts[1].address)).to.be.rejected
    })

    it("Cannot remove a moderator with ZERO_ADDRESS from an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await expect(x2EarnApps.connect(owner).removeAppModerator(app1Id, ZERO_ADDRESS)).to.be.rejected
    })

    it("Cannot remove moderator of non existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))

      await expect(x2EarnApps.connect(owner).removeAppModerator(app1Id, owner.address)).to.be.rejected
    })

    it("Cannot have exceed the maximum number of moderators for an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await x2EarnApps.connect(owner).registerApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      const limit = await x2EarnApps.MAX_MODERATORS()

      const addModeratorPromises = []
      for (let i = 1; i <= limit; i++) {
        const randomWallet = ethers.Wallet.createRandom()
        addModeratorPromises.push(x2EarnApps.connect(appAdmin).addAppModerator(app1Id, randomWallet.address))
      }

      // Wait for all addAppModerator transactions to complete
      await Promise.all(addModeratorPromises)

      await expect(x2EarnApps.connect(appAdmin).addAppModerator(app1Id, otherAccounts[10].address)).to.be.rejected

      // check that having 100 moderators do not affect the app
      const moderators = await x2EarnApps.appModerators(app1Id)
      expect(moderators.length).to.eql(100)

      // check that the last moderator is not the one that failed
      expect(moderators[99]).to.not.eql(otherAccounts[10].address)
      expect(await x2EarnApps.isAppModerator(app1Id, otherAccounts[10].address)).to.be.false
    })
  })

  describe("Reward distributors", function () {
    it("Admin can add a reward distributor to an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await x2EarnApps.connect(owner).addRewardDistributor(app1Id, otherAccounts[1].address)

      const isDistributor = await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[1].address)
      expect(isDistributor).to.be.true
    })

    it("Admin can remove a reward distributor from an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).addRewardDistributor(app1Id, otherAccounts[1].address)

      let isDistributor = await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[1].address)
      expect(isDistributor).to.be.true

      await x2EarnApps.connect(owner).removeRewardDistributor(app1Id, otherAccounts[1].address)

      isDistributor = await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[1].address)
      expect(isDistributor).to.be.false
    })

    it("Cannot add a reward distributor to a non-existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")

      await expect(x2EarnApps.connect(owner).addRewardDistributor(app1Id, owner.address)).to.be.rejected
    })

    it("Cannot remove a reward distributor from a non-existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")

      await expect(x2EarnApps.connect(owner).removeRewardDistributor(app1Id, owner.address)).to.be.rejected
    })

    it("Cannot add ZERO_ADDRESS as a reward distributor of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await expect(x2EarnApps.connect(otherAccounts[0]).addRewardDistributor(app1Id, ZERO_ADDRESS)).to.be.rejected
    })

    it("Cannot remove ZERO_ADDRESS as a reward distributor of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await expect(x2EarnApps.connect(otherAccounts[0]).removeRewardDistributor(app1Id, ZERO_ADDRESS)).to.be.rejected
    })

    it("Cannot remove a non existing reward distributor from an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")

      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await expect(x2EarnApps.connect(owner).removeRewardDistributor(app1Id, otherAccounts[1].address)).to.be.rejected
    })

    it("When having more than one distributor, updating one address won't affect the others", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).addRewardDistributor(app1Id, otherAccounts[1].address)
      await x2EarnApps.connect(owner).addRewardDistributor(app1Id, otherAccounts[2].address)

      let isDistributor = await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[1].address)
      expect(isDistributor).to.be.true

      isDistributor = await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[2].address)
      expect(isDistributor).to.be.true

      await x2EarnApps.connect(owner).removeRewardDistributor(app1Id, otherAccounts[1].address)

      isDistributor = await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[1].address)
      expect(isDistributor).to.be.false

      isDistributor = await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[2].address)
      expect(isDistributor).to.be.true
    })

    it("Can correctly fetch all reward distributors of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).addRewardDistributor(app1Id, otherAccounts[1].address)
      await x2EarnApps.connect(owner).addRewardDistributor(app1Id, otherAccounts[2].address)

      const distributors = await x2EarnApps.rewardDistributors(app1Id)
      expect(distributors).to.eql([otherAccounts[1].address, otherAccounts[2].address])
    })

    it("Can know if an address is a reward distributor of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).addRewardDistributor(app1Id, otherAccounts[1].address)

      let isDistributor = await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[1].address)
      expect(isDistributor).to.be.true

      isDistributor = await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[2].address)
      expect(isDistributor).to.be.false
    })

    it("Cannot add a reward distributor to an app if not an admin", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")

      await expect(x2EarnApps.connect(otherAccounts[0]).addRewardDistributor(app1Id, otherAccounts[1].address)).to.be
        .rejected
    })

    it("Cannot remove a reward distributor from an app if not an admin", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")

      await expect(x2EarnApps.connect(otherAccounts[0]).removeRewardDistributor(app1Id, otherAccounts[1].address)).to.be
        .rejected
    })

    it("Cannot have exceed the maximum number of reward distributors for an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const limit = await x2EarnApps.MAX_REWARD_DISTRIBUTORS()
      const app1Id = await x2EarnApps.hashAppName("My app")
      const appAdmin = otherAccounts[9]
      await x2EarnApps.connect(owner).registerApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      const addDistributorPromises = []
      for (let i = 1; i <= limit; i++) {
        const randomWallet = ethers.Wallet.createRandom()
        addDistributorPromises.push(x2EarnApps.connect(appAdmin).addRewardDistributor(app1Id, randomWallet.address))
      }

      // Wait for all addRewardDistributor transactions to complete
      await Promise.all(addDistributorPromises)

      await expect(x2EarnApps.connect(appAdmin).addRewardDistributor(app1Id, otherAccounts[10].address)).to.be.rejected

      // check that having 100 distributors do not affect the app
      const distributors = await x2EarnApps.rewardDistributors(app1Id)
      expect(distributors.length).to.eql(100)

      // check that the last distributor is not the one that failed
      expect(distributors[99]).to.not.eql(otherAccounts[10].address)
      expect(await x2EarnApps.isRewardDistributor(app1Id, otherAccounts[10].address)).to.be.false
    })
  })

  describe("Team allocation percentage", function () {
    it("By default, the team allocation percentage of an app is 0", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const teamAllocationPercentage = await x2EarnApps.teamAllocationPercentage(app1Id)
      expect(teamAllocationPercentage).to.eql(0n)
    })

    it("Admin can update the team allocation percentage of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).setTeamAllocationPercentage(app1Id, 50)

      let teamAllocationPercentage = await x2EarnApps.teamAllocationPercentage(app1Id)
      expect(teamAllocationPercentage).to.eql(50n)

      await x2EarnApps.connect(owner).setTeamAllocationPercentage(app1Id, 60)

      teamAllocationPercentage = await x2EarnApps.teamAllocationPercentage(app1Id)
      expect(teamAllocationPercentage).to.eql(60n)
    })

    it("Admin can remove the team allocation percentage of an app by setting it to 0", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).setTeamAllocationPercentage(app1Id, 50)

      let teamAllocationPercentage = await x2EarnApps.teamAllocationPercentage(app1Id)
      expect(teamAllocationPercentage).to.eql(50n)
    })

    it("Cannot update the team allocation percentage of a non-existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const appId = await x2EarnApps.hashAppName("non-existing app")

      await expect(x2EarnApps.connect(owner).setTeamAllocationPercentage(appId, 50)).to.be.rejected
    })

    it("Cannot update the team allocation percentage of an app to more than 100", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await expect(x2EarnApps.connect(owner).setTeamAllocationPercentage(app1Id, 101)).to.be.rejected
    })

    it("Cannot update the team allocation percentage of an app to less than 0", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      await expect(x2EarnApps.connect(owner).setTeamAllocationPercentage(app1Id, -1)).to.be.rejected
    })

    it("Non-admin cannot update the team allocation percentage of an app", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await x2EarnApps.hashAppName("My app")

      await expect(x2EarnApps.connect(otherAccounts[0]).setTeamAllocationPercentage(app1Id, 50)).to.be.rejected
    })

    it("User with DEFAULT_ADMIN_ROLE can update the team allocation percentage of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps.connect(owner).setTeamAllocationPercentage(app1Id, 50)

      let teamAllocationPercentage = await x2EarnApps.teamAllocationPercentage(app1Id)
      expect(teamAllocationPercentage).to.eql(50n)
    })

    it("Team allocation percentage of an app is 0 and apps need to withdraw, then they can change this", async function () {
      const { x2EarnApps, otherAccounts, owner, xAllocationVoting, xAllocationPool, b3tr, x2EarnRewardsPool } =
        await getOrDeployContractInstances({ forceDeploy: true })
      const voter = otherAccounts[1]

      await getVot3Tokens(voter, "1")

      const app1Id = await x2EarnApps.hashAppName("My app")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await endorseApp(app1Id, otherAccounts[0])
      await x2EarnApps.connect(owner).setTeamAllocationPercentage(app1Id, 0)

      let teamAllocationPercentage = await x2EarnApps.teamAllocationPercentage(app1Id)
      expect(teamAllocationPercentage).to.eql(0n)

      // start round
      await bootstrapAndStartEmissions()

      // vote
      let roundId = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(roundId, [app1Id], [ethers.parseEther("1")])
      await waitForCurrentRoundToEnd()

      // get balance of team wallet address
      const teamWalletAddress = await x2EarnApps.teamWalletAddress(app1Id)
      const teamWalletBalanceBefore = await b3tr.balanceOf(teamWalletAddress)
      expect(teamWalletBalanceBefore).to.eql(0n)

      const x2EarnRewardsPoolBalanceBefore = await b3tr.balanceOf(await x2EarnRewardsPool.getAddress())
      let appEarnings = await xAllocationPool.roundEarnings(roundId, app1Id)

      // admin claims for app
      await xAllocationPool.connect(owner).claim(roundId, app1Id)

      // all funds should have been sent to the x2EarnRewardsPool contract
      const teamWalletBalanceAfter = await b3tr.balanceOf(teamWalletAddress)
      const x2EarnRewardsPoolBalanceAfter = await b3tr.balanceOf(await x2EarnRewardsPool.getAddress())
      expect(teamWalletBalanceAfter).to.eql(0n)
      expect(x2EarnRewardsPoolBalanceAfter).to.eql(x2EarnRewardsPoolBalanceBefore + appEarnings[0])

      // admin should be able to withdraw the funds
      await x2EarnRewardsPool.connect(otherAccounts[0]).withdraw(appEarnings[0], app1Id, "")
      const x2EarnRewardsPoolBalanceAfterWithdraw = await b3tr.balanceOf(await x2EarnRewardsPool.getAddress())
      expect(x2EarnRewardsPoolBalanceAfterWithdraw).to.eql(x2EarnRewardsPoolBalanceAfter - appEarnings[0])
      const teamWalletBalanceAfterWithdraw = await b3tr.balanceOf(teamWalletAddress)
      expect(teamWalletBalanceAfterWithdraw).to.eql(appEarnings[0])

      // now we start a new round and the app can change the team allocation percentage
      await startNewAllocationRound()
      roundId = await xAllocationVoting.currentRoundId()
      await xAllocationVoting.connect(voter).castVote(roundId, [app1Id], [ethers.parseEther("1")])
      await x2EarnApps.connect(owner).setTeamAllocationPercentage(app1Id, 30)
      teamAllocationPercentage = await x2EarnApps.teamAllocationPercentage(app1Id)
      expect(teamAllocationPercentage).to.eql(30n)
      await waitForCurrentRoundToEnd()

      appEarnings = await xAllocationPool.roundEarnings(roundId, app1Id)

      // admin claims for app
      await xAllocationPool.connect(owner).claim(roundId, app1Id)

      // now the team wallet should have received some funds
      const teamWalletBalanceAfter2 = await b3tr.balanceOf(teamWalletAddress)
      expect(teamWalletBalanceAfter2).to.eql(teamWalletBalanceAfterWithdraw + (appEarnings[0] * 30n) / 100n)

      // 70% of funds should have been sent to the x2EarnRewardsPool contract
      const x2EarnRewardsPoolBalanceAfter2 = await b3tr.balanceOf(await x2EarnRewardsPool.getAddress())
      expect(x2EarnRewardsPoolBalanceAfter2).to.eql(
        x2EarnRewardsPoolBalanceAfterWithdraw + (appEarnings[0] * 70n) / 100n,
      )

      // admin of app can deposit back the funds to the x2EarnRewardsPool
      await b3tr.connect(otherAccounts[0]).approve(await x2EarnRewardsPool.getAddress(), teamWalletBalanceAfter2)
      await x2EarnRewardsPool.connect(otherAccounts[0]).deposit(teamWalletBalanceAfter2.toString(), app1Id)
      const x2EarnRewardsPoolBalanceAfter3 = await b3tr.balanceOf(await x2EarnRewardsPool.getAddress())
      expect(x2EarnRewardsPoolBalanceAfter3).to.eql(x2EarnRewardsPoolBalanceAfter2 + teamWalletBalanceAfter2)
      expect(await b3tr.balanceOf(teamWalletAddress)).to.eql(0n)
    })
  })

  describe("XApp Endorsement", function () {
    it("If an XAPP is endorsed with a score of 100 they should be eligble for XAllocation Voting", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create two Mjolnir node holders with an endorsement score of 50 each
      await createNodeHolder(3, otherAccounts[1]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(3, otherAccounts[2]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      // Endorse XAPP with both Mjolnir node holders
      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      expect(await x2EarnApps.getScore(app1Id)).to.eql(50n) // XAPP endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50
      expect(await x2EarnApps.getScore(app1Id)).to.eql(100n) // XAPP endorsement score is now 100

      const appIdsPendingEndorsement2 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement2.length).to.eql(0)

      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)
      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(true)
    })

    it("If an XAPP is endorsed with a score less than 100 they should not be eligble for XAllocation Voting", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create one Mjolnir node holder with an endorsement score of 50
      await createNodeHolder(3, otherAccounts[1]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      // Endorse XAPP with both Mjolnir node holder -> XAPP endorsement score is 50 -> XAPP is not eligible for XAllocation Voting
      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      expect(await x2EarnApps.getScore(app1Id)).to.eql(50n) // XAPP endorsement score is 50

      const appIdsPendingEndorsement2 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement2.length).to.eql(1)

      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)
      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(false)
    })

    it("If an XAPP has a score of 100 and is unendorsed by a node holder and their score falls below a 100 they will enter a grace period", async function () {
      const { x2EarnApps, xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create two Mjolnir node holders with an endorsement score of 50 each
      await createNodeHolder(3, otherAccounts[1]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(3, otherAccounts[2]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50

      let round1 = await startNewAllocationRound()

      // app should be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // App is not pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // remove endorsement from one of the node holders
      const tx = await x2EarnApps.connect(otherAccounts[1]).unendorseApp(app1Id)

      const receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let events = receipt?.logs

      let decodedEvents = events?.map(event => {
        return x2EarnApps.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })
      const event = decodedEvents.find(event => event?.name === "AppEndorsed")
      expect(event).to.not.equal(undefined)

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // app should be pending endorsement -> score is now 50 -> grace period starts
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round
      let round2 = await startNewAllocationRound()

      // app should still be eligible for the current round as it is in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(true)
    })

    it("If an XAPP is in the grace period for longer than 2 cycles and has not got reendorsed they are removed from voting rounds", async function () {
      const { x2EarnApps, xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create two Mjolnir node holders with an endorsement score of 50 each
      await createNodeHolder(3, otherAccounts[1]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(3, otherAccounts[2]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50

      let round1 = await startNewAllocationRound()

      // app should be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // App is not pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // remove endorsement from one of the node holders
      await x2EarnApps.connect(otherAccounts[1]).unendorseApp(app1Id)

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // app should be pending endorsement -> score is now 50 -> grace period starts
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 1st cycle unedorsed
      let round2 = await startNewAllocationRound()

      // app should still be eligible for the current round as it is in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(true)

      // check endorsement
      await x2EarnApps.checkEndorsement(app1Id)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 2nd cycle unendorsed
      let round3 = await startNewAllocationRound()

      // app should still be eligible for the current round as it is in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round3)
      expect(isEligibleForVote).to.eql(true)

      // check endorsement this time it will remove the app from the voting rounds
      await x2EarnApps.checkEndorsement(app1Id)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 3rd cycle unendorsed
      let round4 = await startNewAllocationRound()

      // app should not be eligible for the current round as it is not in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round4)
      expect(isEligibleForVote).to.eql(false)
    })

    it("If an XAPP is in the grace period for longer than 2 cycles and has not got reendorsed they are removed from voting rounds", async function () {
      const { x2EarnApps, xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create two Mjolnir node holders with an endorsement score of 50 each
      await createNodeHolder(3, otherAccounts[1]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(3, otherAccounts[2]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50

      let round1 = await startNewAllocationRound()

      // app should be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // App is not pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // remove endorsement from one of the node holders
      await x2EarnApps.connect(otherAccounts[1]).unendorseApp(app1Id)

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // app should be pending endorsement -> score is now 50 -> grace period starts
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 1st cycle unedorsed
      let round2 = await startNewAllocationRound()

      // app should still be eligible for the current round as it is in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(true)

      // check endorsement
      await x2EarnApps.checkEndorsement(app1Id)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 2nd cycle unendorsed
      let round3 = await startNewAllocationRound()

      // app should still be eligible for the current round as it is in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round3)
      expect(isEligibleForVote).to.eql(true)

      // remove endorsement from one of the node holders -> grace period is passed -> app is removed from voting rounds
      const tx = await x2EarnApps.connect(otherAccounts[2]).unendorseApp(app1Id)
      const receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      // check event emitted
      let events = receipt?.logs
      let decodedEvents = events?.map(event => {
        return x2EarnApps.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })
      const event = decodedEvents.find(event => event?.name === "AppEndorsementStatusUpdated")
      expect(event).to.not.equal(undefined)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 3rd cycle unendorsed
      let round4 = await startNewAllocationRound()

      // app should not be eligible for the current round as it is not in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round4)
      expect(isEligibleForVote).to.eql(false)
    })

    it("If an XAPP is no longer in eligible for voting as they lost their endorsement they can get added in by getting reendorsed", async function () {
      const { x2EarnApps, xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create two Mjolnir node holders with an endorsement score of 50 each
      await createNodeHolder(3, otherAccounts[1]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(3, otherAccounts[2]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50

      let round1 = await startNewAllocationRound()

      // app should be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // App is not pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // remove endorsement from one of the node holders
      await x2EarnApps.connect(otherAccounts[1]).unendorseApp(app1Id)

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // app should be pending endorsement -> score is now 50 -> grace period starts
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 1st cycle unedorsed
      let round2 = await startNewAllocationRound()

      // app should still be eligible for the current round as it is in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(true)

      // check endorsement
      await x2EarnApps.checkEndorsement(app1Id)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 2nd cycle unendorsed
      let round3 = await startNewAllocationRound()

      // app should still be eligible for the current round as it is in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round3)
      expect(isEligibleForVote).to.eql(true)

      // check endorsement this time it will remove the app from the voting rounds
      await x2EarnApps.checkEndorsement(app1Id)

      // check endorsement
      await x2EarnApps.checkEndorsement(app1Id)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 3rd cycle unendorsed
      let round4 = await startNewAllocationRound()

      // app should not be eligible for the current round as it is not in the grace period
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round4)
      expect(isEligibleForVote).to.eql(false)

      // App is pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // reendorse the app
      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id)

      // App is not pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // wait for round to end
      await waitForCurrentRoundToEnd()
      // start new round -> 4th cycle reendorsed

      let round5 = await startNewAllocationRound()
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round5)
      expect(isEligibleForVote).to.eql(true)
    })

    it("If an XNode endorser transfers its XNode XApp will enter grace period", async function () {
      const { x2EarnApps, xAllocationVoting, otherAccounts, owner, vechainNodes } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create two Mjolnir node holders with an endorsement score of 50 each
      await createNodeHolder(3, otherAccounts[1]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(3, otherAccounts[2]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50

      let round1 = await startNewAllocationRound()

      // app should be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // Skip ahead 1 day to be able to transfer node
      await time.setNextBlockTimestamp((await time.latest()) + 86400)

      // XNode holder transfers its XNode
      const tokenId = await vechainNodes.ownerToId(otherAccounts[1].address)
      await vechainNodes
        .connect(otherAccounts[1])
        .transferFrom(otherAccounts[1].address, otherAccounts[3].address, tokenId)

      const tokenId1 = await vechainNodes.ownerToId(otherAccounts[3].address)
      expect(tokenId1).to.eql(tokenId)

      // this will only get picked up if endorsement is checked
      await x2EarnApps.checkEndorsement(app1Id)

      // app should be pending endorsement -> score is now 50 -> grace period starts
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)
      expect(await x2EarnApps.getScore(app1Id)).to.eql(50n)
    })

    it("An XAPP can only be endorsed if it is pending endorsement (score < 100)", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create MjölnirX node holder with an endorsement score of 100
      await createNodeHolder(7, otherAccounts[1]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100

      // App should be pending endorsement -> score is 0 never endorsed
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // Endorse XAPP with MjölnirX node holder
      const tx = await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 100

      // Check event emitted
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let events = receipt?.logs

      let decodedEvents = events?.map(event => {
        return x2EarnApps.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })
      const event = decodedEvents.find(event => event?.name === "AppEndorsed")
      expect(event).to.not.equal(undefined)

      // Should revert as app is already endorsed
      // Create another MjölnirX node holder with an endorsement score of 100
      await createNodeHolder(7, otherAccounts[2]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100
      await expect(x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id)).to.revertedWithCustomError(
        x2EarnApps,
        "X2EarnAppAlreadyEndorsed",
      )

      // App should not be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // App should be eligible for voting
      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(true)
    })

    it("If a XNode holder loses its XNode status they are removed as an endorser when XApp endorser score is checked", async function () {
      const { x2EarnApps, otherAccounts, owner, vechainNodes } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create MjölnirX node holder with an endorsement score of 100
      await createNodeHolder(7, otherAccounts[1]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100

      // App should be pending endorsement -> score is 0 never endorsed
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // Endorse XAPP with MjölnirX node holder
      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 100

      // App should not be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // Xnode holder should be listed as an endorser
      const endorsers = await x2EarnApps.getEndorsers(app1Id)
      expect(endorsers[0]).to.eql(otherAccounts[1].address)

      // Xnode holder loses its XNode status
      // Skip ahead 1 day to be able to transfer node
      await time.setNextBlockTimestamp((await time.latest()) + 86400)

      // XNode holder transfers its XNode
      const tokenId = await vechainNodes.ownerToId(otherAccounts[1].address)
      await vechainNodes
        .connect(otherAccounts[1])
        .transferFrom(otherAccounts[1].address, otherAccounts[3].address, tokenId)

      // Xnode holder should still be listed as an endorser
      const endorsers1 = await x2EarnApps.getEndorsers(app1Id)
      expect(endorsers1[0]).to.eql(otherAccounts[1].address)

      // this will only get picked up if endorsement is checked
      await x2EarnApps.checkEndorsement(app1Id)

      // Xnode holder should no longer be listed as an endorser
      const endorsers2 = await x2EarnApps.getEndorsers(app1Id)
      expect(endorsers2.length).to.eql(0)
    })

    it("Should return correct value for grace period length", async function () {
      const config = createLocalConfig()
      const { x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: false,
      })
      const gracePeriod = await x2EarnApps.gracePeriod()
      expect(gracePeriod).to.eql(BigInt(config.XAPP_GRACE_PERIOD))
    })

    it("Grace period can be updated by admin with governance role", async function () {
      const config = createLocalConfig()
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const gracePeriod = await x2EarnApps.gracePeriod()
      expect(gracePeriod).to.eql(BigInt(config.XAPP_GRACE_PERIOD))

      await catchRevert(x2EarnApps.connect(otherAccounts[0]).updateGracePeriod(1000))

      const newGracePeriod = 1000
      await x2EarnApps.connect(owner).updateGracePeriod(newGracePeriod)

      const gracePeriodAfterUpdate = await x2EarnApps.gracePeriod()
      expect(gracePeriodAfterUpdate).to.eql(BigInt(newGracePeriod))
    })

    it("Node endorsement scores can be updated by admin with governance role", async function () {
      const config = createLocalConfig()
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      await createNodeHolder(1, otherAccounts[1]) // Node strength level 1 corresponds (Thor) to an endorsement score of 10
      await createNodeHolder(2, otherAccounts[2]) // Node strength level 2 corresponds (Odin) to an endorsement score of 20
      await createNodeHolder(3, otherAccounts[3]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(4, otherAccounts[4]) // Node strength level 4 corresponds (MjolnirX) to an endorsement score of 100
      await createNodeHolder(5, otherAccounts[5]) // Node strength level 5 corresponds (MjolnirX) to an endorsement score of 100
      await createNodeHolder(6, otherAccounts[6]) // Node strength level 6 corresponds (MjolnirX) to an endorsement score of 100
      await createNodeHolder(7, otherAccounts[7]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100

      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[1].address)).to.eql(2n)
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[2].address)).to.eql(13n)
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[3].address)).to.eql(50n)
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[4].address)).to.eql(3n)
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[5].address)).to.eql(9n)
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[6].address)).to.eql(35n)
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[7].address)).to.eql(100n)

      const newEndorsementScores = {
      strength: 1,
      thunder: 2,
      mjolnir: 3,
      veThorX: 4,
      strengthX: 5,
      thunderX: 6,
      mjolnirX: 7,
    }

      await x2EarnApps.connect(owner).updateNodeEndorsementScores(newEndorsementScores)

      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[1].address)).to.eql(BigInt(newEndorsementScores.strength))
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[2].address)).to.eql(BigInt(newEndorsementScores.thunder))
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[3].address)).to.eql(BigInt(newEndorsementScores.mjolnir))
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[4].address)).to.eql(BigInt(newEndorsementScores.veThorX))
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[5].address)).to.eql(BigInt(newEndorsementScores.strengthX))
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[6].address)).to.eql(BigInt(newEndorsementScores.thunderX))
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[7].address)).to.eql(BigInt(newEndorsementScores.mjolnirX))
    })

    it("Endorsement score threshold can be updated by admin with governance role", async function () {
      const config = createLocalConfig()
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      expect(await x2EarnApps.endorsementScoreThreshold()).to.eql(BigInt(100n))

      // Should revert as not admin
      await catchRevert(x2EarnApps.connect(otherAccounts[3]).updateEndorsementScoreThreshold(1000))

      // Update endorsement score threshold
      await x2EarnApps.connect(owner).updateEndorsementScoreThreshold(1000)

      // Check updated endorsement score threshold
      expect(await x2EarnApps.endorsementScoreThreshold()).to.eql(BigInt(1000n))
    })

    it("An XAPP can only endorse one XApp at once", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)
      const app2Id = await x2EarnApps.hashAppName(otherAccounts[1].address)

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(2)

      // Create MjölnirX node holder with an endorsement score of 100
      await createNodeHolder(7, otherAccounts[1]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100

      // App should be pending endorsement -> score is 0 never endorsed
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // Endorse XAPP with MjölnirX node holder
      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 100

      // Should revert as endorser is already endorsing an XApp
      await expect(x2EarnApps.connect(otherAccounts[1]).endorseApp(app2Id)).to.revertedWithCustomError(
        x2EarnApps,
        "X2EarnAlreadyEndorser",
      )

      // App2 should be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app2Id)).to.eql(true)

      // Appw should not be eligible for voting
      expect(await x2EarnApps.isEligibleNow(app2Id)).to.eql(false)
    })

    it("Only an node holder can endorse an XAPP", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Should revert as endorser is already endorsing an XApp
      await expect(x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id)).to.revertedWithCustomError(
        x2EarnApps,
        "X2EarnNonNodeHolder",
      )

      // App2 should be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // Appw should not be eligible for voting
      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(false)
    })

    it("Cannot endorse a blacklisted XAPP and a blacklisted App cannot be pending endorsement", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      // Blacklist XAPP
      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, false)

      // Create MjölnirX node holder with an endorsement score of 100
      await createNodeHolder(7, otherAccounts[1]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100

      // Should revert as endorser is already endorsing an XApp
      await expect(x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id)).to.revertedWithCustomError(
        x2EarnApps,
        "X2EarnAppBlacklisted",
      )

      // App2 should be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // Appw should not be eligible for voting
      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(false)
    })

    it("Cannot endorse an XAPP that does not exist", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // AppId that does not exist
      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Should revert as endorser is already endorsing an XApp
      await expect(x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id)).to.revertedWithCustomError(
        x2EarnApps,
        "X2EarnNonexistentApp",
      )
    })

    it("Cannot unendorse an XAPP that does not exist", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // AppId that does not exist
      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Should revert as endorser is already endorsing an XApp
      await expect(x2EarnApps.connect(otherAccounts[1]).unendorseApp(app1Id)).to.revertedWithCustomError(
        x2EarnApps,
        "X2EarnNonexistentApp",
      )
    })

    it("Cannot unendorse an XAPP if not an endorser", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      // AppId that does not exist
      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Should revert as user is not an endorser
      await expect(x2EarnApps.connect(otherAccounts[1]).unendorseApp(app1Id)).to.revertedWithCustomError(
        x2EarnApps,
        "X2EarnNonEndorser",
      )
    })

    it("Cannot check endorsement status of an XAPP that does not exist", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // AppId that does not exist
      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Should revert as endorser is already endorsing an XApp
      await expect(x2EarnApps.connect(otherAccounts[1]).checkEndorsement(app1Id)).to.revertedWithCustomError(
        x2EarnApps,
        "X2EarnNonexistentApp",
      )
    })

    it("Does not revert if checking the status of a blacklisted XAPP", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      // Blacklist XAPP
      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, false)

      expect(await x2EarnApps.checkEndorsement(app1Id)).to.not.be.reverted
    })

    it("A blacklisted XAPP is not pending endorsement", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      // Blacklist XAPP
      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, false)

      // App should not be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)
    })

    it("A node holder can remove endorsement if a XAPP is blacklisted", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      // Create MjölnirX node holder with an endorsement score of 100
      await createNodeHolder(7, otherAccounts[0]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100

      // Endorse XAPP with MjölnirX node holder
      await x2EarnApps.connect(otherAccounts[0]).endorseApp(app1Id) // Node holder endorsement score is 100

      // Blacklist XAPP
      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, false)

      // Should not revert as endorser if the XAPP is blacklisted
      await expect(x2EarnApps.connect(otherAccounts[0]).unendorseApp(app1Id)).to.not.be.reverted

      // App should not be pending endorsement -> blacklisted XApps should not be pendng endosement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // Xnode holder should no longer be listed as an endorser
      const endorsers = await x2EarnApps.getEndorsers(app1Id)
      expect(endorsers.length).to.eql(0)

      // Endorser should be able to endorse a different XAPP
      const app2Id = await x2EarnApps.hashAppName(otherAccounts[1].address)

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")

      await expect(x2EarnApps.connect(otherAccounts[0]).endorseApp(app2Id)).to.not.be.reverted
    })

    it("A node holder can unendorse one XAPP and reendorse another", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      // Create MjölnirX node holder with an endorsement score of 100
      await createNodeHolder(7, otherAccounts[0]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100

      // Endorse XAPP with MjölnirX node holder
      await x2EarnApps.connect(otherAccounts[0]).endorseApp(app1Id) // Node holder endorsement score is 100

      // Should not revert as endorser if the XAPP is blacklisted
      await expect(x2EarnApps.connect(otherAccounts[0]).unendorseApp(app1Id)).to.not.be.reverted

      // App should not be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // Xnode holder should no longer be listed as an endorser
      const endorsers = await x2EarnApps.getEndorsers(app1Id)
      expect(endorsers.length).to.eql(0)

      // Endorser should be able to endorse a different XAPP
      const app2Id = await x2EarnApps.hashAppName(otherAccounts[1].address)

      // Register XAPPs -> XAPP is pending endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI")

      await expect(x2EarnApps.connect(otherAccounts[0]).endorseApp(app2Id)).to.not.be.reverted

      // Node holder should listed as endorser
      const endorsers2 = await x2EarnApps.getEndorsers(app2Id)
      expect(endorsers2[0]).to.eql(otherAccounts[0].address)
    })

    it("An XAPP that has been black listed should not be elgible for voting in following rounds even if endorsed", async function () {
      const { x2EarnApps, xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create two Mjolnir node holders with an endorsement score of 50 each
      await createNodeHolder(3, otherAccounts[1]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(3, otherAccounts[2]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50

      let round1 = await startNewAllocationRound()

      // app should be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // App is not pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // blacklist XAPP from future rounds
      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, false)

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // app should not be pending endorsement -> blacklisted XAPPS shoould nto be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 1st cycle unedorsed
      let round2 = await startNewAllocationRound()

      // app should not be eligible for voting in current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)

      // user should still be endorsed by XAPPS
      const endorsers = await x2EarnApps.getEndorsers(app1Id)
      expect(endorsers.length).to.eql(2)

      // check endorsement
      await x2EarnApps.checkEndorsement(app1Id)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 2nd cycle unendorsed
      let round3 = await startNewAllocationRound()

      // app should still still not be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round3)
      expect(isEligibleForVote).to.eql(false)
    })

    it("An XAPP that has been removed from black list that had no endorsers should be pending endorsement", async function () {
      const { x2EarnApps, xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await x2EarnApps.hasRole(await x2EarnApps.GOVERNANCE_ROLE(), owner.address)).to.eql(true)

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create two Mjolnir node holders with an endorsement score of 50 each
      await createNodeHolder(3, otherAccounts[1]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(3, otherAccounts[2]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50

      let round1 = await startNewAllocationRound()

      // app should be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // App is not pending endorsement
      //expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // blacklist XAPP from future rounds
      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, false)

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      // app should not be pending endorsement -> blacklisted XAPPS shoould nto be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // start new round -> 1st cycle unedorsed
      let round2 = await startNewAllocationRound()

      // app should not be eligible for voting in current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)

      // XAPP gets unendorsed
      await x2EarnApps.connect(otherAccounts[1]).unendorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).unendorseApp(app1Id) // Node holder endorsement score is 50

      // check endorsers should be 0
      const endorsers2 = await x2EarnApps.getEndorsers(app1Id)
      expect(endorsers2.length).to.eql(0)

      // app should not be pending endorsement -> blacklisted XAPPS shoould not be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)

      // wait for round to end
      await waitForCurrentRoundToEnd()

      // Remove XAPP from blacklist
      await x2EarnApps.connect(owner).setVotingEligibility(app1Id, true)

      // To find XAPPS that have been unblacklisted need to check endorsement status
      await x2EarnApps.checkEndorsement(app1Id)

      // Should be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // endorse XAPP
      await x2EarnApps.connect(otherAccounts[1]).endorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50

      // start new round
      let round3 = await startNewAllocationRound()

      expect(await xAllocationVoting.isEligibleForVote(app1Id, round3)).to.eql(true)
    })

    it("Should be able to get a node holders endorsement score", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await createNodeHolder(0, otherAccounts[0]) // Node strength level 0 corresponds (None) to an endorsement score of 0
      await createNodeHolder(1, otherAccounts[1]) // Node strength level 1 corresponds (Strength) to an endorsement score of 2
      await createNodeHolder(2, otherAccounts[2]) // Node strength level 2 corresponds (Thunder) to an endorsement score of 13
      await createNodeHolder(3, otherAccounts[3]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(4, otherAccounts[4]) // Node strength level 4 corresponds (VeThorX) to an endorsement score of 3
      await createNodeHolder(5, otherAccounts[5]) // Node strength level 5 corresponds (StrengthX) to an endorsement score of 9
      await createNodeHolder(6, otherAccounts[6]) // Node strength level 6 corresponds (ThunderX) to an endorsement score of 35
      await createNodeHolder(7, otherAccounts[7]) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100

      // Get endorsement score
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[0].address)).to.eql(0n) // Node strength level 0 corresponds (None) to an endorsement score of 0
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[1].address)).to.eql(2n) // Node strength level 1 corresponds (Strength) to an endorsement score of 2
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[2].address)).to.eql(13n) // Node strength level 2 corresponds (Thunder) to an endorsement score of 13
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[3].address)).to.eql(50n) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[4].address)).to.eql(3n) // Node strength level 4 corresponds (VeThorX) to an endorsement score of 3
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[5].address)).to.eql(9n) // Node strength level 5 corresponds (StrengthX) to an endorsement score of 9
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[6].address)).to.eql(35n) // Node strength level 6 corresponds (ThunderX) to an endorsement score of 35
      expect(await x2EarnApps.getNodeEndorsementScore(otherAccounts[7].address)).to.eql(100n) // Node strength level 7 corresponds (MjolnirX) to an endorsement score of 100
    })

    it("If an XAPP has a score less than 100 but one of its endorsers increases the node strength when endorsement status is checked they will be endorsed ", async function () {
      const { x2EarnApps, otherAccounts, owner, vechainNodes } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await x2EarnApps.hashAppName(otherAccounts[0].address)

      // Register XAPP -> XAPP is pedning endorsement
      await x2EarnApps
        .connect(owner)
        .registerApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      const appIdsPendingEndorsement1 = await x2EarnApps.appIdsPendingEndorsement()
      expect(appIdsPendingEndorsement1.length).to.eql(1)

      // Create two node holders with an endorsement score
      await createNodeHolder(2, owner) // Node strength level 2 corresponds (Thunder) to an endorsement score of 13
      await createNodeHolder(3, otherAccounts[2]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50
      await createNodeHolder(3, otherAccounts[3]) // Node strength level 3 corresponds (Mjolnir) to an endorsement score of 50

      // Endorse XAPP with node holder -> combined endorsement score is 63 -> less than 100
      await x2EarnApps.connect(owner).endorseApp(app1Id) // Node holder endorsement score is 50
      await x2EarnApps.connect(otherAccounts[2]).endorseApp(app1Id) // Node holder endorsement score is 50

      // Check endorsement
      await x2EarnApps.checkEndorsement(app1Id)

      // app should be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(true)

      // app should not be eligible for voting
      expect(await x2EarnApps.isEligibleNow(app1Id)).to.eql(false)

      // Skip ahead 1 day to be able to transfer node
      await time.setNextBlockTimestamp((await time.latest()) + 86400)
      // XNode holder increases its node strength by getting a new node
      const tokenId1 = await vechainNodes.ownerToId(owner.address)
      await vechainNodes.connect(owner).transferFrom(owner.address, otherAccounts[4].address, tokenId1)
      const tokenId2 = await vechainNodes.ownerToId(otherAccounts[3].address)
      await vechainNodes.connect(otherAccounts[3]).transferFrom(otherAccounts[3].address, owner.address, tokenId2)

      // check endorsement
      await x2EarnApps.checkEndorsement(app1Id)

      // app should be pending endorsement
      expect(await x2EarnApps.appPendingEndorsment(app1Id)).to.eql(false)
    })
  })
})
