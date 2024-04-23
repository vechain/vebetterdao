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

describe("X-Apps", function () {
  describe("Settings", function () {
    it("Admin can set baseURI for apps", async function () {
      const { owner, x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: true })

      const initialURI = await x2EarnApps.baseURI()

      await x2EarnApps.connect(owner).setBaseURI("ipfs2://")

      const updatedURI = await x2EarnApps.baseURI()
      expect(updatedURI).to.eql("ipfs2://")
      expect(updatedURI).to.not.eql(initialURI)
    })
  })

  describe("Add apps", function () {
    it("Should be able to add an app successfully", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      let tx = await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let appAdded = filterEventsByName(receipt.logs, "AppAdded")
      expect(appAdded).not.to.eql([])

      let { id, address } = await parseAppAddedEvent(appAdded[0])
      expect(id).to.eql(app1Id)
      expect(address).to.eql(otherAccounts[0].address)
    })

    it("Should not be able to add an app if it is already added", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      await catchRevert(
        x2EarnApps
          .connect(owner)
          .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI"),
      )
    })

    it("Only admin address should be able to add an app", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      await catchRevert(
        x2EarnApps
          .connect(otherAccounts[0])
          .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI"),
      )
    })

    it("Should be possible to add a new app through the DAO", async function () {
      const { otherAccounts, x2EarnApps, governor, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await bootstrapAndStartEmissions()

      const proposer = otherAccounts[0]
      const voter1 = otherAccounts[1]
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("Bike 4 Life"))

      // check that the DAO is admin of the x2EarnApps contract
      await x2EarnApps.connect(owner).grantRole(await x2EarnApps.DEFAULT_ADMIN_ROLE(), await governor.getAddress())
      expect(await x2EarnApps.hasRole(await x2EarnApps.DEFAULT_ADMIN_ROLE(), await governor.getAddress())).to.be.true

      // check that app does not exists
      expect(await x2EarnApps.appExists(app1Id)).to.be.false

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        x2EarnApps,
        await ethers.getContractFactory("X2EarnApps"),
        "Add app to the list",
        "addApp",
        [otherAccounts[1].address, otherAccounts[1].address, "Bike 4 Life", "metadataURI"],
      )

      // check that app was added
      const app = await x2EarnApps.app(app1Id)
      expect(app[0]).to.eql(app1Id)
      expect(app[1]).to.eql(otherAccounts[1].address)
      expect(app[2]).to.eql("Bike 4 Life")

      const admin = await x2EarnApps.appAdmin(app1Id)
      expect(admin).to.eql(otherAccounts[1].address)
    }).timeout(18000000)

    it("Should be able to fetch app receiver address", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

      const app1ReceiverAddress = await x2EarnApps.getAppReceiverAddress(app1Id)
      const app2ReceiverAddress = await x2EarnApps.getAppReceiverAddress(app2Id)
      expect(app1ReceiverAddress).to.eql(otherAccounts[2].address)
      expect(app2ReceiverAddress).to.eql(otherAccounts[3].address)
    })

    it("Cannot add an app that has ZERO address as the receiver", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(
        x2EarnApps.connect(owner).addApp(ZERO_ADDRESS, otherAccounts[2].address, "My app", "metadataURI"),
      )
    })

    it("Cannot add an app that has ZERO address as the admin", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(
        x2EarnApps.connect(owner).addApp(otherAccounts[2].address, ZERO_ADDRESS, "My app", "metadataURI"),
      )
    })
  })

  describe("Fetch apps", function () {
    it("Can retrieve app by id", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const app = await x2EarnApps.app(app1Id)
      expect(app.id).to.eql(app1Id)
      expect(app.receiverAddress).to.eql(otherAccounts[0].address)
      expect(app.name).to.eql("My app")
      expect(app.metadataURI).to.eql("metadataURI")
      expect(app.createdAt).to.eql(await x2EarnApps.clock())
    })

    it("Can index apps", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[1].address, otherAccounts[1].address, "My app #2", "metadataURI")

      const apps = await x2EarnApps.apps()
      expect(apps.length).to.eql(2)
    })

    // Test is disabled because it takes a bit too long to run
    console.log("Skipping test: Can index up to 1300 apps")
    // it("Can index up to 1300 apps", async function () {
    //   const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })

    //   for (let i = 0; i < 1300; i++) {
    //     await x2EarnApps
    //       .connect(owner)
    //       .addApp(otherAccounts[1].address, otherAccounts[1].address, "My app" + i, "metadataURI")
    //   }

    //   const apps = await x2EarnApps.apps()
    //   expect(apps.length).to.eql(1300)
    // })
  })

  describe("App availability for allocation voting", function () {
    it("Should be possible to add an app and make it available for allocation voting", async function () {
      const { x2EarnApps, xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await x2EarnApps.hashName(otherAccounts[0].address)

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      let roundId = await startNewAllocationRound()

      const isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, roundId)
      expect(isEligibleForVote).to.eql(true)
    })

    it("Admin can make an app unavailable for allocation voting starting from next round", async function () {
      const { xAllocationVoting, x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await x2EarnApps.hashName(otherAccounts[0].address)
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      let round1 = await startNewAllocationRound()

      await x2EarnApps.connect(owner).setVotingElegibility(app1Id, false)

      // app should still be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      let appsVotedInSpecificRound = await xAllocationVoting.getAppIds(round1)
      expect(appsVotedInSpecificRound.length).to.equal(1n)

      await waitForRoundToEnd(round1)
      let round2 = await startNewAllocationRound()

      // app should not be elegible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)

      appsVotedInSpecificRound = await xAllocationVoting.getAppIds(round2)
      expect(appsVotedInSpecificRound.length).to.equal(0)

      // if checking for the previous round, it should still be eligible
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)
    })

    it("Admin can make an unavailable app available again starting from next round", async function () {
      const { xAllocationVoting, x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await x2EarnApps.hashName(otherAccounts[0].address)
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      await x2EarnApps.connect(owner).setVotingElegibility(app1Id, false)
      expect(await x2EarnApps.isElegibleNow(app1Id)).to.eql(false)

      let round1 = await startNewAllocationRound()

      // app should still be eligible for the current round
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(false)

      await x2EarnApps.connect(owner).setVotingElegibility(app1Id, true)
      expect(await x2EarnApps.isElegibleNow(app1Id)).to.eql(true)
      expect(await x2EarnApps.isElegible(app1Id, await xAllocationVoting.roundSnapshot(round1))).to.eql(false)

      // app still should not be elegible from this round
      expect(await xAllocationVoting.isEligibleForVote(app1Id, round1)).to.eql(false)

      await waitForRoundToEnd(round1)

      let round2 = await startNewAllocationRound()

      // app should be elegible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(true)
    })

    it("Cannot get eligibility for non-existing app", async function () {
      const { xAllocationVoting, x2EarnApps } = await getOrDeployContractInstances({ forceDeploy: true })

      const app1Id = await x2EarnApps.hashName(ZERO_ADDRESS)

      await expect(x2EarnApps.isElegibleNow(app1Id)).to.be.reverted
      await expect(x2EarnApps.isElegible(app1Id, (await xAllocationVoting.clock()) - 1n)).to.be.reverted
    })

    it("Cannot get elegilibity in the future", async function () {
      const { xAllocationVoting, x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const app1Id = await x2EarnApps.hashName(otherAccounts[0].address)
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      await expect(x2EarnApps.isElegible(app1Id, (await xAllocationVoting.clock()) + 1n)).to.be.reverted
    })

    it("DAO can make an app unavailable for allocation voting starting from next round", async function () {
      const { otherAccounts, x2EarnApps, xAllocationVoting, emissions } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await bootstrapAndStartEmissions()

      const app1Id = await x2EarnApps.hashName("Bike 4 Life")
      const proposer = otherAccounts[0]
      const voter1 = otherAccounts[1]

      // check that app does not exists
      await expect(x2EarnApps.app(app1Id)).to.be.reverted

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        x2EarnApps,
        await ethers.getContractFactory("X2EarnApps"),
        "Add app to the list",
        "addApp",
        [otherAccounts[0].address, otherAccounts[0].address, "Bike 4 Life", "metadataURI"],
      )

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
        "setVotingElegibility",
        [app1Id, false],
      )

      // app should still be eligible for the current round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(true)

      await waitForCurrentRoundToEnd()

      await emissions.distribute()
      let round2 = await xAllocationVoting.currentRoundId()

      // app should not be elegible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(false)
    })

    it("Non-admin address cannot make an app available or unavailable for allocation voting", async function () {
      const { x2EarnApps, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: false })

      const app1Id = await x2EarnApps.hashName(otherAccounts[0].address)

      await catchRevert(x2EarnApps.connect(otherAccounts[0]).setVotingElegibility(app1Id, true))
    })

    it("App needs to wait next round if added during an ongoing round", async function () {
      const { otherAccounts, x2EarnApps, owner, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      const voter = otherAccounts[0]
      await getVot3Tokens(voter, "1000")

      const app1Id = await x2EarnApps.hashName(otherAccounts[0].address)

      let round1 = await startNewAllocationRound()

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      let isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round1)
      expect(isEligibleForVote).to.eql(false)

      //check that I cannot vote for this app in current round
      await catchRevert(xAllocationVoting.connect(voter).castVote(round1, [app1Id], [ethers.parseEther("1")]))

      let appVotes = await xAllocationVoting.getAppVotes(round1, app1Id)
      expect(appVotes).to.equal(0n)

      let appsVotedInSpecificRound = await xAllocationVoting.getAppIds(round1)
      expect(appsVotedInSpecificRound.length).to.equal(0)

      await waitForRoundToEnd(round1)
      let round2 = await startNewAllocationRound()

      // app should not be elegible from this round
      isEligibleForVote = await xAllocationVoting.isEligibleForVote(app1Id, round2)
      expect(isEligibleForVote).to.eql(true)

      // check that I can vote for this app
      expect(await xAllocationVoting.connect(voter).castVote(round2, [app1Id], [ethers.parseEther("1")])).to.not.be
        .reverted

      appVotes = await xAllocationVoting.getAppVotes(round2, app1Id)
      expect(appVotes).to.equal(ethers.parseEther("1"))
    })
  })

  describe("Admin address", function () {
    it("Admin can update the admin address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

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
      const app1Id = await x2EarnApps.hashName("My app")
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const baseURI = await x2EarnApps.baseURI()
      const appURI = await x2EarnApps.appURI(app1Id)

      expect(appURI).to.eql(baseURI + "metadataURI")
    })

    it("Admin role can update app metadata", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const newMetadataURI = "metadataURI2"
      await x2EarnApps.connect(owner).updateAppMetadata(app1Id, newMetadataURI)

      const appURI = await x2EarnApps.appURI(app1Id)
      expect(appURI).to.eql((await x2EarnApps.baseURI()) + newMetadataURI)
    })

    it("Admin of app can update app metadata", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await x2EarnApps.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

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
      await x2EarnApps.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

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
      await x2EarnApps.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", oldMetadataURI)

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

  describe("Receiver address", function () {
    it("Should be able to fetch app receiver address", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress = await x2EarnApps.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress).to.eql(otherAccounts[0].address)
    })

    it("Governance admin role can update the receiver address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.getAppReceiverAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await x2EarnApps.connect(owner).updateAppReceiverAddress(app1Id, otherAccounts[1].address)

      const appReceiverAddress2 = await x2EarnApps.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(otherAccounts[1].address)
      expect(appReceiverAddress1).to.not.eql(appReceiverAddress2)
    })

    it("App admin can update the receiver address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await x2EarnApps.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.getAppReceiverAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, appAdmin.address)
      expect(isAdmin).to.be.false

      expect(await x2EarnApps.isAppAdmin(app1Id, appAdmin.address)).to.be.true

      await x2EarnApps.connect(appAdmin).updateAppReceiverAddress(app1Id, otherAccounts[1].address)

      const appReceiverAddress2 = await x2EarnApps.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(otherAccounts[1].address)
      expect(appReceiverAddress1).to.not.eql(appReceiverAddress2)
    })

    it("Moderators cannot update the receiver address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.getAppReceiverAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await expect(x2EarnApps.connect(otherAccounts[1]).updateAppReceiverAddress(app1Id, otherAccounts[1].address)).to
        .be.rejected

      const appReceiverAddress2 = await x2EarnApps.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(appReceiverAddress1)
    })

    it("Moderators cannot update the receiver address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.getAppReceiverAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await expect(x2EarnApps.connect(otherAccounts[1]).updateAppReceiverAddress(app1Id, otherAccounts[1].address)).to
        .be.rejected

      const appReceiverAddress2 = await x2EarnApps.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(appReceiverAddress1)
    })

    it("Non-admin cannot update the receiver address of an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await x2EarnApps.getAppReceiverAddress(app1Id)

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, otherAccounts[1].address)
      expect(isAdmin).to.be.false

      await expect(x2EarnApps.connect(otherAccounts[1]).updateAppReceiverAddress(app1Id, otherAccounts[1].address)).to
        .be.rejected

      const appReceiverAddress2 = await x2EarnApps.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(appReceiverAddress1)
    })

    it("Cannot update the receiver address of a non-existing app", async function () {
      const { x2EarnApps, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const newReceiverAddress = ethers.Wallet.createRandom().address

      await expect(x2EarnApps.connect(owner).updateAppReceiverAddress(app1Id, newReceiverAddress)).to.be.rejected
    })
  })

  describe("App Moderators", function () {
    it("By default there is no moderator for an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[0].address)
      expect(isModerator).to.be.false

      const moderators = await x2EarnApps.appModerators(app1Id)
      expect(moderators).to.eql([])
    })

    it("Governance admin role can add a moderator to an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const adminRole = await x2EarnApps.DEFAULT_ADMIN_ROLE()
      const isAdmin = await x2EarnApps.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await x2EarnApps.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await x2EarnApps.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true
    })

    it("Governance admin role can remove a moderator from an app", async function () {
      const { x2EarnApps, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
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
      await x2EarnApps.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

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
      await x2EarnApps.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")
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
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
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
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
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
  })
})
