import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import { setupSignalingFixture } from "./fixture.test"
import { VeBetterPassport } from "../../typechain-types"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { BytesLike } from "ethers"

describe("VeBetterPassportV4 (Reset Signal Count) - @shard8d", function () {
  let veBetterPassport: VeBetterPassport
  let owner: SignerWithAddress
  let otherAccounts: SignerWithAddress[]
  let appId: BytesLike
  let regularSignaler: SignerWithAddress
  let resetSignaler: SignerWithAddress
  let user: SignerWithAddress

  beforeEach(async function () {
    const fixture = await setupSignalingFixture()
    veBetterPassport = fixture.veBetterPassport
    owner = fixture.owner
    otherAccounts = fixture.otherAccounts
    appId = fixture.appId
    regularSignaler = fixture.regularSignaler

    // Setup a reset signaler with proper role
    resetSignaler = otherAccounts[5]
    await veBetterPassport.connect(owner).assignSignalerToApp(appId, resetSignaler.address)
    await veBetterPassport.connect(owner).grantRole(await veBetterPassport.RESET_SIGNALER_ROLE(), resetSignaler.address)

    // Setup a user with signals
    user = otherAccounts[6]
    await veBetterPassport.connect(owner).registerActionForRound(user.address, appId, 1)
    await veBetterPassport.connect(regularSignaler).signalUser(user.address)
    await veBetterPassport.connect(regularSignaler).signalUser(user.address)

    // Verify initial state
    expect(await veBetterPassport.signaledCounter(user.address)).to.equal(2)
    expect(await veBetterPassport.appSignalsCounter(appId, user.address)).to.equal(2)
    expect(await veBetterPassport.appTotalSignalsCounter(appId)).to.equal(2)
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

  describe("Reset Signals by RESET_SIGNALER_ROLE", function () {
    it("Should revert if a caller does not have RESET_SIGNALER_ROLE", async function () {
      await expect(veBetterPassport.connect(otherAccounts[7]).resetUserSignalsWithReason(user.address, "no signals")).to
        .be.reverted
    })

    it("Should allow reset signaler to reset user signals", async function () {
      await expect(
        veBetterPassport.connect(resetSignaler).resetUserSignalsWithReason(user.address, "bot detection lifted"),
      )
        .to.emit(veBetterPassport, "UserSignalsReset")
        .withArgs(user.address, "bot detection lifted")

      expect(await veBetterPassport.signaledCounter(user.address)).to.equal(0)

      // Remain the same as before because we're only resetting the signal count
      expect(await veBetterPassport.appSignalsCounter(appId, user.address)).to.equal(2)
      expect(await veBetterPassport.appTotalSignalsCounter(appId)).to.equal(2)
    })

    it("Should correctly handle resetting signals for passport-linked entities", async function () {
      const entity = otherAccounts[9]
      const passport = otherAccounts[10]

      await veBetterPassport.connect(entity).linkEntityToPassport(passport.address)
      await veBetterPassport.connect(passport).acceptEntityLink(entity.address)

      await veBetterPassport.connect(owner).registerActionForRound(entity.address, appId, 1)
      await veBetterPassport.connect(regularSignaler).signalUser(entity.address)

      expect(await veBetterPassport.signaledCounter(entity.address)).to.equal(1)
      expect(await veBetterPassport.signaledCounter(passport.address)).to.equal(1)
      expect(await veBetterPassport.appSignalsCounter(appId, entity.address)).to.equal(1)
      expect(await veBetterPassport.appSignalsCounter(appId, passport.address)).to.equal(1)

      await veBetterPassport.connect(resetSignaler).resetUserSignalsWithReason(entity.address, "linked entity")

      expect(await veBetterPassport.signaledCounter(entity.address)).to.equal(0)
      expect(await veBetterPassport.signaledCounter(passport.address)).to.equal(0)
      expect(await veBetterPassport.appSignalsCounter(appId, entity.address)).to.equal(1)
      expect(await veBetterPassport.appSignalsCounter(appId, passport.address)).to.equal(1)
    })
  })
})
