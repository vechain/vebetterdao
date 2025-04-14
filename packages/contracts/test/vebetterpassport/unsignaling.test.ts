import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { setupSignalingFixture } from "./fixture.test"
import { VeBetterPassport } from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { BytesLike } from "ethers"

describe("Passport Unsignaling Logic - @shard8b", function () {
  let veBetterPassport: VeBetterPassport
  let owner: SignerWithAddress
  let otherAccounts: SignerWithAddress[]
  let appId: BytesLike
  let regularSignaler: SignerWithAddress

  beforeEach(async function () {
    const fixture = await setupSignalingFixture()
    veBetterPassport = fixture.veBetterPassport
    owner = fixture.owner
    otherAccounts = fixture.otherAccounts
    appId = fixture.appId
    regularSignaler = fixture.regularSignaler
  })

  describe("Default Admin Unsignaling", function () {
    it("Should reject unsignaling if user was not previously signaled", async function () {
      const userNotSignaled = otherAccounts[2]

      await expect(veBetterPassport.connect(owner).unsignalUser(userNotSignaled.address, "test")).to.be.revertedWith(
        "BotSignaling: user has no signals",
      )
    })

    it("Should reject unsignaling if caller has no permission (not admin)", async function () {
      const user = otherAccounts[2]
      const unprivilegedUser = otherAccounts[13]

      await veBetterPassport.connect(owner).signalUser(user.address)

      // Try to unsignal with unprivileged user
      await expect(veBetterPassport.connect(unprivilegedUser).unsignalUser(user.address, "test")).to.be.reverted

      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(1)
    })

    it("Should allow to unsignal users", async function () {
      const user = otherAccounts[2]

      // Signal user without prior interaction
      await veBetterPassport.connect(owner).signalUser(user.address)

      // Verify user was signaled
      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(1)

      await expect(veBetterPassport.connect(owner).unsignalUser(user.address, "test"))
        .to.emit(veBetterPassport, "UserUnsignaled")
        .withArgs(user.address, owner.address, "test")

      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(0)
    })

    it("Should allow unsignaling a previously signaled user", async function () {
      const user = otherAccounts[2]

      await veBetterPassport.connect(owner).registerActionForRound(user.address, appId, 1)

      // Signal the user
      await veBetterPassport.connect(owner).signalUser(user.address)

      // Verify user was signaled
      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(1)

      // Now unsignal the user
      await expect(veBetterPassport.connect(owner).unsignalUser(user.address, "test"))
        .to.emit(veBetterPassport, "UserUnsignaled")
        .withArgs(user.address, owner.address, "test")

      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(0)
    })

    it("Should correctly handle unsignaling for passport-linked entities", async function () {
      const entity = otherAccounts[9]
      const passport = otherAccounts[10]

      // SCENARIO
      // Entity A is linked to passport B
      // Entity A is signaled by default admin
      // Unsignal entity A
      // Verify both entity A and passport B are unsignaled

      // Set up the passport link
      await veBetterPassport.connect(entity).linkEntityToPassport(passport.address)
      await veBetterPassport.connect(passport).acceptEntityLink(entity.address)
      expect(await veBetterPassport.getPassportForEntity(entity.address)).to.equal(passport.address)

      // Signal the entity
      await veBetterPassport.connect(owner).signalUser(entity.address)

      // Verify passport were signaled
      expect(await veBetterPassport.signaledCounter(entity.address)).to.equal(1)
      expect(await veBetterPassport.signaledCounter(passport.address)).to.equal(1)

      // Unsignal the entity
      await veBetterPassport.connect(owner).unsignalUser(entity.address, "test")

      // Verify both entity and passport were unsignaled
      expect(await veBetterPassport.signaledCounter(entity.address)).to.equal(0)
      expect(await veBetterPassport.signaledCounter(passport.address)).to.equal(0)
    })
  })

  describe("Signaler Unsignaling", function () {
    it("Should reject unsignaling if signaler is rogue and is not assigned to an app", async function () {
      const user = otherAccounts[2]
      const rogueSignaler = otherAccounts[8]

      // Grant SIGNALER_ROLE to a rouge wallet without using assignSignalerToAppByAppAdmin or assignSignalerToApp
      await veBetterPassport.connect(owner).grantRole(await veBetterPassport.SIGNALER_ROLE(), rogueSignaler.address)

      await expect(
        veBetterPassport.connect(rogueSignaler).unsignalUserByAppAdmin(user.address, "test"),
      ).to.be.revertedWith("BotSignaling: signaler not assigned to any app")
    })

    it("Should reject unsignaling if user has no signals from the app", async function () {
      const user = otherAccounts[2]

      await veBetterPassport.connect(owner).registerActionForRound(user.address, appId, 1)

      await expect(
        veBetterPassport.connect(regularSignaler).unsignalUserByAppAdmin(user.address, "test"),
      ).to.be.revertedWith("BotSignaling: user has no signals from this app")
    })

    it("Should allow to unsignal users they previously signaled", async function () {
      const user = otherAccounts[2]

      // Assign action to user to mock interaction
      await veBetterPassport.connect(owner).registerActionForRound(user.address, appId, 1)

      await veBetterPassport.connect(regularSignaler).signalUser(user.address)

      // Verify user was signaled
      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(1)
      expect(await veBetterPassport.appSignalsCounter(appId, user.address)).to.equal(1)
      expect(await veBetterPassport.appTotalSignalsCounter(appId)).to.equal(1)

      await expect(veBetterPassport.connect(regularSignaler).unsignalUserByAppAdmin(user.address, "test"))
        .to.emit(veBetterPassport, "UserUnsignaled")
        .withArgs(user.address, regularSignaler.address, "test")

      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(0)
      expect(await veBetterPassport.appSignalsCounter(appId, user.address)).to.equal(0)
      expect(await veBetterPassport.appTotalSignalsCounter(appId)).to.equal(0)
    })

    it("Should correctly handle app admin unsignaling for passport-linked entities", async function () {
      const entity = otherAccounts[9]
      const passport = otherAccounts[10]

      // Set up the passport link
      await veBetterPassport.connect(entity).linkEntityToPassport(passport.address)
      await veBetterPassport.connect(passport).acceptEntityLink(entity.address)

      // Set up entity with an action
      await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)

      // Signal from regular signaler
      await veBetterPassport.connect(regularSignaler).signalUser(entity.address)

      // Verify both entity and passport were signaled and app counters updated
      expect(await veBetterPassport.signaledCounter(entity.address)).to.equal(1)
      expect(await veBetterPassport.signaledCounter(passport.address)).to.equal(1)
      expect(await veBetterPassport.appSignalsCounter(appId, entity.address)).to.equal(1)
      expect(await veBetterPassport.appSignalsCounter(appId, passport.address)).to.equal(1)

      // App total signals counter should be 1
      expect(await veBetterPassport.appTotalSignalsCounter(appId)).to.equal(1)

      await expect(veBetterPassport.connect(regularSignaler).unsignalUserByAppAdmin(entity.address, "test"))
        .to.emit(veBetterPassport, "UserUnsignaled")
        .withArgs(entity.address, regularSignaler.address, "test")

      expect(await veBetterPassport.signaledCounter(entity.address)).to.equal(0)
      expect(await veBetterPassport.signaledCounter(passport.address)).to.equal(0)
      expect(await veBetterPassport.appSignalsCounter(appId, entity.address)).to.equal(0)
      expect(await veBetterPassport.appSignalsCounter(appId, passport.address)).to.equal(0)
      expect(await veBetterPassport.appTotalSignalsCounter(appId)).to.equal(0)
    })
  })
})
