import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { setupSignalingFixture } from "./fixture.test"
import { VeBetterPassport } from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { BytesLike } from "ethers"

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

    it("Should allow admin to assign and remove a reset signaler", async function () {
      const newResetSignaler = otherAccounts[7]

      await expect(veBetterPassport.connect(owner).assignResetSignalerToApp(appId, newResetSignaler.address))
        .to.emit(veBetterPassport, "ResetSignalerAssignedToApp")
        .withArgs(newResetSignaler.address, appId)

      expect(await veBetterPassport.hasRole(await veBetterPassport.RESET_SIGNALER_ROLE(), newResetSignaler.address)).to
        .be.true

      await expect(veBetterPassport.connect(owner).removeResetSignalerFromApp(newResetSignaler.address))
        .to.emit(veBetterPassport, "ResetSignalerRemovedFromApp")
        .withArgs(newResetSignaler.address, appId)

      expect(await veBetterPassport.hasRole(await veBetterPassport.RESET_SIGNALER_ROLE(), newResetSignaler.address)).to
        .be.false
    })
  })

  describe("Reset Signals by RESET_SIGNALER_ROLE", function () {
    it("Should revert if a caller does not have RESET_SIGNALER_ROLE", async function () {
      await expect(veBetterPassport.connect(otherAccounts[7]).resetUserSignalsWithReason(user.address, "no signals")).to
        .be.reverted
    })

    it("Should allow reset signaler to reset user signals", async function () {
      await expect(veBetterPassport.connect(owner).assignResetSignalerToApp(appId, resetSignaler.address))
        .to.emit(veBetterPassport, "ResetSignalerAssignedToApp")
        .withArgs(resetSignaler.address, appId)

      await expect(
        veBetterPassport.connect(resetSignaler).resetUserSignalsWithReason(user.address, "bot detection lifted"),
      )
        .to.emit(veBetterPassport, "UserSignalsReset")
        .withArgs(user.address, "bot detection lifted")

      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(0)
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

    it("Should allow app admin to assign a reset signaler", async function () {
      const targetResetSignaler = otherAccounts[7]

      // App admin assigns reset signaler
      await expect(
        veBetterPassport.connect(appAdmin).assignResetSignalerToAppByAppAdmin(appId, targetResetSignaler.address),
      )
        .to.emit(veBetterPassport, "ResetSignalerAssignedToApp")
        .withArgs(targetResetSignaler.address, appId)

      // Verify the user has the role
      expect(await veBetterPassport.hasRole(await veBetterPassport.RESET_SIGNALER_ROLE(), targetResetSignaler.address))
        .to.be.true

      // New reset signaler should be able to reset signals
      await expect(
        veBetterPassport
          .connect(targetResetSignaler)
          .resetUserSignalsWithReason(user.address, "app admin assigned reset"),
      )
        .to.emit(veBetterPassport, "UserSignalsReset")
        .withArgs(user.address, "app admin assigned reset")

      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(0)
    })

    it("Should allow app admin to remove a reset signaler", async function () {
      const targetResetSignaler = otherAccounts[8]

      await veBetterPassport.connect(appAdmin).assignResetSignalerToAppByAppAdmin(appId, targetResetSignaler.address)

      await expect(veBetterPassport.connect(appAdmin).removeResetSignalerFromAppByAppAdmin(targetResetSignaler.address))
        .to.emit(veBetterPassport, "ResetSignalerRemovedFromApp")
        .withArgs(targetResetSignaler.address, appId)

      expect(await veBetterPassport.hasRole(await veBetterPassport.RESET_SIGNALER_ROLE(), targetResetSignaler.address))
        .to.be.false

      await expect(
        veBetterPassport.connect(targetResetSignaler).resetUserSignalsWithReason(user.address, "should fail"),
      ).to.be.reverted
    })

    it("Should not allow non-app-admin to assign reset signalers", async function () {
      const nonAdminAccount = otherAccounts[9]
      const targetResetSignaler = otherAccounts[10]

      await expect(
        veBetterPassport
          .connect(nonAdminAccount)
          .assignResetSignalerToAppByAppAdmin(appId, targetResetSignaler.address),
      ).to.be.reverted
    })

    it("Should not allow non-app-admin to remove reset signalers", async function () {
      const targetResetSignaler = otherAccounts[11]
      const nonAdminAccount = otherAccounts[12]

      await veBetterPassport.connect(appAdmin).assignResetSignalerToAppByAppAdmin(appId, targetResetSignaler.address)

      await expect(
        veBetterPassport.connect(nonAdminAccount).removeResetSignalerFromAppByAppAdmin(targetResetSignaler.address),
      ).to.be.reverted
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
})
