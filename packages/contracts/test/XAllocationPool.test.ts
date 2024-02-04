import { ethers } from "hardhat"
import { expect } from "chai"
import { catchRevert, filterEventsByName, getOrDeployContractInstances, parseAppAddedEvent } from "./helpers"
import { describe, it } from "mocha"

describe.only("XAllocation Voting", function () {
  describe("XAllocationPool", function () {
    it("Should be able to add an app successfully", async function () {
      const { xAllocationPool, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      let tx = await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address)
      let receipt = await tx.wait()
      if (!receipt) throw new Error("No receipt")

      let appAdded = filterEventsByName(receipt.logs, "AppAdded")
      expect(appAdded).not.to.eql([])

      let { id, address } = parseAppAddedEvent(appAdded[0], xAllocationPool)
      expect(id).to.eql(app1Id)
      expect(address).to.eql(otherAccounts[0].address)
    })

    it("Should not be able to add an app if it is already added", async function () {
      const { xAllocationPool, otherAccounts, owner } = await getOrDeployContractInstances({ forceDeploy: true })
      await xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address)

      await catchRevert(xAllocationPool.connect(owner).addApp(otherAccounts[0].address, otherAccounts[0].address))
    })

    it("Only admin address should be able to add an app", async function () {
      const { xAllocationPool, otherAccounts } = await getOrDeployContractInstances({ forceDeploy: true })

      await catchRevert(
        xAllocationPool.connect(otherAccounts[0]).addApp(otherAccounts[0].address, otherAccounts[0].address),
      )
    })

    it("Should be possible to add a new app through the DAO")
  })
})
