import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { setupSignalingFixture } from "./fixture.test"
import { VeBetterPassport } from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { BytesLike, ethers } from "ethers"

describe("VeBetterPassport (Reset Signal Count) - @shard8c", function () {
  let veBetterPassport: VeBetterPassport
  let owner: SignerWithAddress
  let otherAccounts: SignerWithAddress[]
  let appId: BytesLike
  let regularSignaler: SignerWithAddress
  let resetSignaler: SignerWithAddress
  let user: SignerWithAddress
  let appAdmin: SignerWithAddress

  beforeEach(async function () {
    const fixture = await setupSignalingFixture()
    veBetterPassport = fixture.veBetterPassport
    owner = fixture.owner
    otherAccounts = fixture.otherAccounts
    appId = fixture.appId
    regularSignaler = fixture.regularSignaler
    appAdmin = fixture.appAdmin

    // Setup a reset signaler with proper role
    resetSignaler = otherAccounts[5]
    await veBetterPassport.connect(owner).assignSignalerToApp(appId, resetSignaler.address)
    await veBetterPassport.connect(owner).grantRole(await veBetterPassport.RESET_SIGNALER_ROLE(), resetSignaler.address)

    // Setup a user with signals
    user = otherAccounts[6]
    await veBetterPassport.connect(owner).registerActionForRound(user.address, appId, 1)
    await veBetterPassport.connect(regularSignaler).signalUserWithReason(user.address, "Test")
    await veBetterPassport.connect(regularSignaler).signalUserWithReason(user.address, "Test1")

    // Verify initial state
    expect(await veBetterPassport.signaledCounter(user.address)).to.equal(2)
  })

  describe("Reset Signals by Default Admin", function () {
    it("Should allow to reset user signals", async function () {
      await expect(
        veBetterPassport.connect(owner).resetUserSignalsWithReason(user.address, "suspicious activity lifted"),
      )
        .to.emit(veBetterPassport, "UserSignalsReset")
        .withArgs(user.address, "suspicious activity lifted")

      // Verify signals were reset
      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(0)
    })
  })

  describe("Reset Signals by RESET_SIGNALER_ROLE (internal use)", function () {
    it("Should revert if a caller does not have RESET_SIGNALER_ROLE", async function () {
      await expect(veBetterPassport.connect(otherAccounts[7]).resetUserSignalsWithReason(user.address, "no signals")).to
        .be.reverted
    })

    it("Should correctly handle resetting signals for passport-linked entities", async function () {
      const entity = otherAccounts[9]
      const passport = otherAccounts[10]

      await veBetterPassport.connect(entity).linkEntityToPassport(passport.address)
      await veBetterPassport.connect(passport).acceptEntityLink(entity.address)

      await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)
      await veBetterPassport.connect(regularSignaler).signalUserWithReason(entity.address, "Test")

      expect(await veBetterPassport.signaledCounter(entity.address)).to.equal(1)
      expect(await veBetterPassport.signaledCounter(passport.address)).to.equal(1)

      await veBetterPassport.connect(resetSignaler).resetUserSignalsWithReason(entity.address, "linked entity")

      expect(await veBetterPassport.signaledCounter(entity.address)).to.equal(0)
      expect(await veBetterPassport.signaledCounter(passport.address)).to.equal(0)
    })

    it("Should allow resetting signals for a user with zero signals", async function () {
      const userWithZeroSignals = otherAccounts[13]

      // Verify the user starts with 0 signals
      expect(await veBetterPassport.signaledCounter(userWithZeroSignals.address)).to.equal(0)

      // Reset the signals
      await expect(
        veBetterPassport
          .connect(resetSignaler)
          .resetUserSignalsWithReason(userWithZeroSignals.address, "preventative reset"),
      )
        .to.emit(veBetterPassport, "UserSignalsReset")
        .withArgs(userWithZeroSignals.address, "preventative reset")

      expect(await veBetterPassport.signaledCounter(userWithZeroSignals.address)).to.equal(0)
    })

    it("Should allow a reset signaler to reset their own signals", async function () {
      await veBetterPassport.connect(regularSignaler).signalUserWithReason(resetSignaler.address, "Suspicious activity")
      expect(await veBetterPassport.signaledCounter(resetSignaler.address)).to.equal(1)

      await expect(
        veBetterPassport
          .connect(resetSignaler)
          .resetUserSignalsWithReason(resetSignaler.address, "clearing my own record"),
      )
        .to.emit(veBetterPassport, "UserSignalsReset")
        .withArgs(resetSignaler.address, "clearing my own record")

      expect(await veBetterPassport.signaledCounter(resetSignaler.address)).to.equal(0)
    })
  })

  describe("Reset Signals by SIGNALER_ROLE (for app admins)", function () {
    it("Should revert if a caller does not have SIGNALER_ROLE", async function () {
      await expect(
        veBetterPassport.connect(otherAccounts[7]).resetUserSignalsByAppWithReason(user.address, "no signals"),
      ).to.be.reverted
    })

    it("Should revert if random user tries to assign signaler role", async function () {
      await expect(
        veBetterPassport.connect(otherAccounts[7]).assignSignalerToAppByAppAdmin(appId, otherAccounts[7].address),
      ).to.be.reverted
    })

    it("Should revert if random user tries to remove signaler role", async function () {
      await expect(veBetterPassport.connect(otherAccounts[7]).removeSignalerFromApp(otherAccounts[7].address)).to.be
        .reverted
    })

    it("Should allow a signaler to reset signals", async function () {
      const randomUser = otherAccounts[14]

      await veBetterPassport.connect(appAdmin).assignSignalerToAppByAppAdmin(appId, regularSignaler.address)

      await veBetterPassport.connect(regularSignaler).signalUserWithReason(randomUser.address, "Suspicious activity")

      expect(await veBetterPassport.signaledCounter(randomUser.address)).to.equal(1)

      await expect(
        veBetterPassport
          .connect(regularSignaler)
          .resetUserSignalsByAppWithReason(randomUser.address, "clearing a record"),
      )
        .to.emit(veBetterPassport, "UserSignalsResetForApp")
        .withArgs(randomUser.address, appId, "clearing a record")

      expect(await veBetterPassport.signaledCounter(randomUser.address)).to.equal(0)
    })

    it("Should allow app admin to assign signaler role, then is able to revoke it, then is able to assign it again", async function () {
      const newSignaler = otherAccounts[8]

      await veBetterPassport.connect(appAdmin).assignSignalerToAppByAppAdmin(appId, newSignaler.address)
      expect(await veBetterPassport.appOfSignaler(newSignaler.address)).to.equal(appId)
      expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), newSignaler.address)).to.be.true

      await veBetterPassport.connect(appAdmin).removeSignalerFromAppByAppAdmin(newSignaler.address)
      expect(await veBetterPassport.appOfSignaler(newSignaler.address)).to.equal(ethers.ZeroHash)
      expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), newSignaler.address)).to.be.false

      await veBetterPassport.connect(appAdmin).assignSignalerToAppByAppAdmin(appId, newSignaler.address)
      expect(await veBetterPassport.appOfSignaler(newSignaler.address)).to.equal(appId)
      expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), newSignaler.address)).to.be.true
    })
  })
})
