import { ethers } from "hardhat"
import { expect } from "chai"
import {
  catchRevert,
  createProposalAndExecuteIt,
  filterEventsByName,
  getOrDeployContractInstances,
  parseAppAddedEvent,
} from "./helpers"
import { describe, it } from "mocha"

describe("X-Apps", function () {
  describe("Add apps", function () {
    it("Should be able to add an app successfully", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      let tx = await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let appAdded = filterEventsByName(receipt.logs, "AppAdded")
      expect(appAdded).not.to.eql([])

      let { id, address } = parseAppAddedEvent(appAdded[0], xAllocationVoting)
      expect(id).to.eql(app1Id)
      expect(address).to.eql(otherAccounts[0].address)
    })

    it("Should not be able to add an app if it is already added", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI")

      await catchRevert(
        xAllocationVoting
          .connect(owner)
          .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI"),
      )
    })

    it("Only admin address should be able to add an app", async function () {
      const { xAllocationVoting, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      await catchRevert(
        xAllocationVoting
          .connect(otherAccounts[0])
          .addApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI"),
      )
    })

    it("Should be possible to add a new app through the DAO", async function () {
      const { xAllocationVoting, otherAccounts, governor } = await getOrDeployContractInstances({ forceDeploy: true })

      const proposer = otherAccounts[0]
      const voter1 = otherAccounts[1]
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("Bike 4 Life"))

      // check that app does not exists
      await expect(xAllocationVoting.getApp(app1Id)).to.be.reverted

      await createProposalAndExecuteIt(
        proposer,
        voter1,
        governor,
        xAllocationVoting,
        await ethers.getContractFactory("XAllocationVoting"),
        "Add app to the list",
        "addApp",
        [otherAccounts[1].address, otherAccounts[1].address, "Bike 4 Life", "metadataURI"],
      )

      // check that app was added
      const app = await xAllocationVoting.getApp(app1Id)
      expect(app[0]).to.eql(app1Id)
      expect(app[1]).to.eql(otherAccounts[1].address)
      expect(app[2]).to.eql(otherAccounts[1].address)
      expect(app[3]).to.eql("Bike 4 Life")
    }).timeout(18000000)

    it("Should be able to fetch app receiver address", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, "My app", "metadataURI")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, "My app #2", "metadataURI")

      const app1ReceiverAddress = await xAllocationVoting.getAppReceiverAddress(app1Id)
      const app2ReceiverAddress = await xAllocationVoting.getAppReceiverAddress(app2Id)
      expect(app1ReceiverAddress).to.eql(otherAccounts[2].address)
      expect(app2ReceiverAddress).to.eql(otherAccounts[3].address)
    })
  })

  describe("Apps metadata", function () {
    it("Admin should be able to update baseURI", async function () {
      const { xAllocationVoting, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const newBaseURI = "ipfs://new-base-uri"
      await xAllocationVoting.connect(owner).setBaseURI(newBaseURI)
      expect(await xAllocationVoting.baseURI()).to.eql(newBaseURI)
    })

    it("Non-admin should not be able to update baseURI", async function () {
      const { xAllocationVoting, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })
      await catchRevert(xAllocationVoting.connect(otherAccounts[0]).setBaseURI("ipfs://new-base-uri"))
    })

    it("Should be able to fetch app metadata", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = await xAllocationVoting.hashName("My app")
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const baseURI = await xAllocationVoting.baseURI()
      const appURI = await xAllocationVoting.appURI(app1Id)

      expect(appURI).to.eql(baseURI + "metadataURI")
    })

    it("Admin role can update app metadata", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const newMetadataURI = "metadataURI2"
      await xAllocationVoting.connect(owner).updateAppMetadata(app1Id, newMetadataURI)

      const appURI = await xAllocationVoting.appURI(app1Id)
      expect(appURI).to.eql((await xAllocationVoting.baseURI()) + newMetadataURI)
    })

    it("Admin of app can update app metadata", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      const newMetadataURI = "metadataURI2"
      await xAllocationVoting.connect(appAdmin).updateAppMetadata(app1Id, newMetadataURI)

      const appURI = await xAllocationVoting.appURI(app1Id)
      expect(appURI).to.eql((await xAllocationVoting.baseURI()) + newMetadataURI)
    })

    it("Moderator can update app metadata", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      const appModerator = otherAccounts[10]
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      await xAllocationVoting.connect(appAdmin).addAppModerator(app1Id, appModerator.address)
      expect(await xAllocationVoting.isAppModerator(app1Id, appModerator.address)).to.be.true

      const newMetadataURI = "metadataURI2"
      await xAllocationVoting.connect(appModerator).updateAppMetadata(app1Id, newMetadataURI)

      const appURI = await xAllocationVoting.appURI(app1Id)
      expect(appURI).to.eql((await xAllocationVoting.baseURI()) + newMetadataURI)
    })

    it("Unatuhtorized users cannot update app metadata", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      const unauthorizedUser = otherAccounts[8]
      const oldMetadataURI = "metadataURI"
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, appAdmin.address, "My app", oldMetadataURI)

      const newMetadataURI = "metadataURI2"
      await expect(xAllocationVoting.connect(unauthorizedUser).updateAppMetadata(app1Id, newMetadataURI)).to.be.rejected

      const appURI = await xAllocationVoting.appURI(app1Id)
      expect(appURI).to.eql((await xAllocationVoting.baseURI()) + oldMetadataURI)
    })
  })

  describe("Receiver address", function () {
    it("Should be able to fetch app receiver address", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress = await xAllocationVoting.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress).to.eql(otherAccounts[0].address)
    })

    it("Governance admin role can update the receiver address of an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await xAllocationVoting.getAppReceiverAddress(app1Id)

      const adminRole = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      const isAdmin = await xAllocationVoting.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await xAllocationVoting.connect(owner).updateAppReceiverAddress(app1Id, otherAccounts[1].address)

      const appReceiverAddress2 = await xAllocationVoting.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(otherAccounts[1].address)
      expect(appReceiverAddress1).to.not.eql(appReceiverAddress2)
    })

    it("App admin can update the receiver address of an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      const appReceiverAddress1 = await xAllocationVoting.getAppReceiverAddress(app1Id)

      const adminRole = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      const isAdmin = await xAllocationVoting.hasRole(adminRole, appAdmin.address)
      expect(isAdmin).to.be.false

      expect(await xAllocationVoting.isAppAdmin(app1Id, appAdmin.address)).to.be.true

      await xAllocationVoting.connect(appAdmin).updateAppReceiverAddress(app1Id, otherAccounts[1].address)

      const appReceiverAddress2 = await xAllocationVoting.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(otherAccounts[1].address)
      expect(appReceiverAddress1).to.not.eql(appReceiverAddress2)
    })

    it("Moderators cannot update the receiver address of an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await xAllocationVoting.getAppReceiverAddress(app1Id)

      const adminRole = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      const isAdmin = await xAllocationVoting.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await xAllocationVoting.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await expect(
        xAllocationVoting.connect(otherAccounts[1]).updateAppReceiverAddress(app1Id, otherAccounts[1].address),
      ).to.be.rejected

      const appReceiverAddress2 = await xAllocationVoting.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(appReceiverAddress1)
    })

    it("Moderators cannot update the receiver address of an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await xAllocationVoting.getAppReceiverAddress(app1Id)

      const adminRole = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      const isAdmin = await xAllocationVoting.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await xAllocationVoting.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await expect(
        xAllocationVoting.connect(otherAccounts[1]).updateAppReceiverAddress(app1Id, otherAccounts[1].address),
      ).to.be.rejected

      const appReceiverAddress2 = await xAllocationVoting.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(appReceiverAddress1)
    })

    it("Non-admin cannot update the receiver address of an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const appReceiverAddress1 = await xAllocationVoting.getAppReceiverAddress(app1Id)

      const adminRole = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      const isAdmin = await xAllocationVoting.hasRole(adminRole, otherAccounts[1].address)
      expect(isAdmin).to.be.false

      await expect(
        xAllocationVoting.connect(otherAccounts[1]).updateAppReceiverAddress(app1Id, otherAccounts[1].address),
      ).to.be.rejected

      const appReceiverAddress2 = await xAllocationVoting.getAppReceiverAddress(app1Id)
      expect(appReceiverAddress2).to.eql(appReceiverAddress1)
    })
  })

  describe("App Moderators", function () {
    it("By default there is no moderator for an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[0].address)
      expect(isModerator).to.be.false

      const moderators = await xAllocationVoting.appModerators(app1Id)
      expect(moderators).to.eql([])
    })

    it("Governance admin role can add a moderator to an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")

      const adminRole = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      const isAdmin = await xAllocationVoting.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      await xAllocationVoting.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true
    })

    it("Governance admin role can remove a moderator from an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await xAllocationVoting.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      const adminRole = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      const isAdmin = await xAllocationVoting.hasRole(adminRole, owner.address)
      expect(isAdmin).to.be.true

      let isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await xAllocationVoting.connect(owner).removeAppModerator(app1Id, otherAccounts[1].address)

      isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.false
    })

    it("App admin can add a moderator to an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")

      const adminRole = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      const isAdmin = await xAllocationVoting.hasRole(adminRole, appAdmin.address)
      expect(isAdmin).to.be.false

      expect(await xAllocationVoting.isAppAdmin(app1Id, appAdmin.address)).to.be.true

      await xAllocationVoting.connect(appAdmin).addAppModerator(app1Id, otherAccounts[1].address)

      const isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true
    })

    it("App admin can remove a moderator from an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const appAdmin = otherAccounts[9]
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, appAdmin.address, "My app", "metadataURI")
      await xAllocationVoting.connect(appAdmin).addAppModerator(app1Id, otherAccounts[1].address)

      const adminRole = await xAllocationVoting.DEFAULT_ADMIN_ROLE()
      const isAdmin = await xAllocationVoting.hasRole(adminRole, appAdmin.address)
      expect(isAdmin).to.be.false

      expect(await xAllocationVoting.isAppAdmin(app1Id, appAdmin.address)).to.be.true

      let isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      await xAllocationVoting.connect(appAdmin).removeAppModerator(app1Id, otherAccounts[1].address)

      isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.false
    })

    it("Can correctly fetch all moderators of an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await xAllocationVoting.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)
      await xAllocationVoting.connect(owner).addAppModerator(app1Id, otherAccounts[2].address)

      const moderators = await xAllocationVoting.appModerators(app1Id)
      expect(moderators).to.eql([otherAccounts[1].address, otherAccounts[2].address])
    })

    it("Can know if an address is a moderator of an app", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      await xAllocationVoting
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccounts[0].address, "My app", "metadataURI")
      await xAllocationVoting.connect(owner).addAppModerator(app1Id, otherAccounts[1].address)

      let isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[1].address)
      expect(isModerator).to.be.true

      isModerator = await xAllocationVoting.isAppModerator(app1Id, otherAccounts[2].address)
      expect(isModerator).to.be.false
    })
  })
})
