import { ethers } from "hardhat"
import { describe, it, before } from "mocha"
import { expect } from "chai"
import { setupSignalingFixture } from "./fixture.test"
import { VeBetterPassport } from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { BytesLike } from "ethers"

describe("Passport Signaling Logic - @shard8a", function () {
  let veBetterPassport: VeBetterPassport
  let owner: SignerWithAddress
  let otherAccounts: SignerWithAddress[]
  let appId: BytesLike
  let regularSignaler: SignerWithAddress

  before(async function () {
    const fixture = await setupSignalingFixture()
    veBetterPassport = fixture.veBetterPassport
    owner = fixture.owner
    otherAccounts = fixture.otherAccounts
    appId = fixture.appId
    regularSignaler = fixture.regularSignaler
  })

  describe("Signaling By Default Admin", function () {
    it("Should allow to signal any user without prior interaction", async function () {
      const user = otherAccounts[4]

      expect(await veBetterPassport.hasRole(await veBetterPassport.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true

      await expect(veBetterPassport.connect(owner).signalUser(user.address))
        .to.emit(veBetterPassport, "UserSignaled")
        .withArgs(user.address, owner.address, ethers.ZeroHash, "")

      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(1)
    })
  })

  describe("Signaling By SIGNALER_ROLE", function () {
    it("Should revert signaling if user has no app interaction", async function () {
      const userWithNoInteraction = otherAccounts[3]

      await expect(
        veBetterPassport.connect(regularSignaler).signalUser(userWithNoInteraction.address),
      ).to.be.revertedWith("BotSignaling: user has not interacted with signaler's app")
    })

    it("Should allow signaling after user interacts with app", async function () {
      const user = otherAccounts[3]

      await veBetterPassport.connect(owner).registerActionForRound(user.address, appId, 1)

      await expect(veBetterPassport.connect(regularSignaler).signalUser(user.address))
        .to.emit(veBetterPassport, "UserSignaled")
        .withArgs(user.address, regularSignaler.address, appId, "")

      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(1)
    })
  })
})
