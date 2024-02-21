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

      let tx = await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address)
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
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address)

      await catchRevert(xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address))
    })

    it("Only admin address should be able to add an app", async function () {
      const { xAllocationVoting, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      await catchRevert(
        xAllocationVoting.connect(otherAccounts[0]).addApp(otherAccounts[0].address, otherAccounts[0].address),
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
        [otherAccounts[1].address, "Bike 4 Life"],
      )

      // check that app was added
      const app = await xAllocationVoting.getApp(app1Id)
      expect(app[0]).to.eql(app1Id)
      expect(app[1]).to.eql(otherAccounts[1].address)
      expect(app[2]).to.eql("Bike 4 Life")
    }).timeout(18000000)

    it("Should be able to fetch app receiver address", async function () {
      const { xAllocationVoting, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes("My app"))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes("My app #2"))
      await xAllocationVoting.connect(owner).addApp(otherAccounts[2].address, "My app")
      await xAllocationVoting.connect(owner).addApp(otherAccounts[3].address, "My app #2")

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
      await xAllocationVoting.connect(owner).addApp(otherAccounts[0].address, "My app")

      const baseURI = await xAllocationVoting.baseURI()
      const appURI = await xAllocationVoting.appURI(app1Id)

      expect(appURI).to.eql(baseURI + app1Id)
    })
  })
})
