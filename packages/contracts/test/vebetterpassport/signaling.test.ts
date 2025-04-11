import { ethers } from "hardhat"
import { BytesLike } from "ethers"
import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"

import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

import { getOrDeployContractInstances } from "../helpers"
import { endorseApp } from "../helpers/xnodes"
import { VeBetterPassport } from "../../typechain-types"

describe.only("Passport Signaling Logic - @shard8a", function () {
  let veBetterPassport: VeBetterPassport
  let owner: SignerWithAddress
  let otherAccounts: SignerWithAddress[]
  let x2EarnApps: any // Replace with specific contract type if available
  let appId: BytesLike
  let appAdmin: SignerWithAddress
  let regularSignaler: SignerWithAddress
  let defaultAdminSignaler: SignerWithAddress

  beforeEach(async function () {
    // Setup contracts
    const contracts = await getOrDeployContractInstances({
      forceDeploy: true,
    })
    veBetterPassport = contracts.veBetterPassport
    owner = contracts.owner
    otherAccounts = contracts.otherAccounts
    x2EarnApps = contracts.x2EarnApps

    // Create an app
    appAdmin = otherAccounts[0]
    await x2EarnApps
      .connect(owner)
      .submitApp(otherAccounts[0].address, appAdmin, otherAccounts[0].address, "metadataURI")
    appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
    await endorseApp(appId, otherAccounts[0])

    // Setup signalers
    regularSignaler = otherAccounts[1]
    await veBetterPassport.connect(appAdmin).assignSignalerToAppByAppAdmin(appId, regularSignaler.address)

    defaultAdminSignaler = otherAccounts[2]
    await veBetterPassport
      .connect(owner)
      .grantRole(await veBetterPassport.SIGNALER_ROLE(), defaultAdminSignaler.address)

    // Setup for registering actions
    await veBetterPassport.connect(owner).grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)
    await veBetterPassport.connect(owner).setAppSecurity(appId, 1) // Set security to LOW
  })

  it("should reject signaling if user has no app interaction", async function () {
    const userWithNoInteraction = otherAccounts[3]

    await expect(
      veBetterPassport.connect(regularSignaler).signalUser(userWithNoInteraction.address),
    ).to.be.revertedWith("BotSignaling: user has not interacted with signaler's app")
  })

  it("should allow signaling after user interacts with app", async function () {
    const user = otherAccounts[3]

    // Register an action for the user to create an interaction
    await veBetterPassport.connect(owner).registerActionForRound(user.address, appId, 1)

    // Now signaler can signal the user
    await expect(veBetterPassport.connect(regularSignaler).signalUser(user.address))
      .to.emit(veBetterPassport, "UserSignaled")
      .withArgs(user.address, regularSignaler.address, appId, "")

    expect(await veBetterPassport.signaledCounter(user.address)).to.equal(1)
  })

  it("should allow default admin signaler to signal any user without prior interaction", async function () {
    const user = otherAccounts[4]

    // Verify default admin signaler has no app
    expect(await veBetterPassport.appOfSignaler(defaultAdminSignaler.address)).to.equal(ethers.ZeroHash)

    // Default admin can signal without prior interaction
    await expect(veBetterPassport.connect(defaultAdminSignaler).signalUser(user.address))
      .to.emit(veBetterPassport, "UserSignaled")
      .withArgs(user.address, defaultAdminSignaler.address, ethers.ZeroHash, "")

    expect(await veBetterPassport.signaledCounter(user.address)).to.equal(1)
  })
})
