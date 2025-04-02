import { ethers } from "hardhat"
import { expect } from "chai"
import { bootstrapAndStartEmissions, getOrDeployContractInstances } from ".."
import { describe, it } from "mocha"
import { endorseApp } from "../xnodes"

describe.only("VePassportPassport - Signaling", function () {
  it("Should prevent the same application from signaling a user more than once", async function () {
    const { x2EarnApps, otherAccounts, otherAccount, owner, veBetterPassport } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    const appAdmin = otherAccounts[0]

    // Create an app
    await x2EarnApps
      .connect(owner)
      .submitApp(otherAccounts[0].address, appAdmin, otherAccounts[0].address, "metadataURI")

    const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

    await endorseApp(appId, otherAccounts[0])

    // Assign signaler role to an account
    await expect(veBetterPassport.connect(appAdmin).assignSignalerToAppByAppAdmin(appId, otherAccount.address))
      .to.emit(veBetterPassport, "SignalerAssignedToApp")
      .withArgs(otherAccount.address, appId)

    expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), otherAccount.address)).to.be.true

    // First signal should succeed
    await expect(veBetterPassport.connect(otherAccount).signalUser(owner.address))
      .to.emit(veBetterPassport, "UserSignaled")
      .withArgs(owner.address, otherAccount.address, appId, "")

    // Verify signal was counted
    expect(await veBetterPassport.signaledCounter(owner.address)).to.equal(1)
    expect(await veBetterPassport.appSignalsCounter(appId, owner.address)).to.equal(1)

    // Second signal from the same app should fail
    await expect(veBetterPassport.connect(otherAccount).signalUser(owner.address)).to.be.revertedWith(
      "User can only be signaled once by an app",
    )

    // Signals should remain unchanged
    expect(await veBetterPassport.signaledCounter(owner.address)).to.equal(1)
    expect(await veBetterPassport.appSignalsCounter(appId, owner.address)).to.equal(1)
  })

  it("Should allow DEFAULT_ADMIN_ROLE to signal the same user multiple times (without being an app admin)", async function () {
    const { veBetterPassport, owner, otherAccount, otherAccounts, x2EarnApps } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    // Confirm owner has default admin role
    const DEFAULT_ADMIN_ROLE = await veBetterPassport.DEFAULT_ADMIN_ROLE()
    expect(await veBetterPassport.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true

    // Create an app with a different account as app admin to ensure owner is not an app admin
    const appAdmin = otherAccounts[0]
    await x2EarnApps
      .connect(owner)
      .submitApp(otherAccounts[1].address, appAdmin, otherAccounts[1].address, "metadataURI")

    const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))

    // Verify owner is not the app admin
    expect(await x2EarnApps.isAppAdmin(appId, owner.address)).to.be.false

    // First signal should succeed
    await expect(veBetterPassport.connect(owner).signalUser(otherAccount.address))
      .to.emit(veBetterPassport, "UserSignaled")
      .withArgs(
        otherAccount.address,
        owner.address,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "",
      )

    // Verify signal was counted
    expect(await veBetterPassport.signaledCounter(otherAccount.address)).to.equal(1)

    // Second signal should also succeed for admin
    await expect(veBetterPassport.connect(owner).signalUser(otherAccount.address))
      .to.emit(veBetterPassport, "UserSignaled")
      .withArgs(
        otherAccount.address,
        owner.address,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "",
      )

    // Verify signal counter increased
    expect(await veBetterPassport.signaledCounter(otherAccount.address)).to.equal(2)

    // Third signal should also succeed for admin
    await expect(veBetterPassport.connect(owner).signalUserWithReason(otherAccount.address, "Third signal from admin"))
      .to.emit(veBetterPassport, "UserSignaled")
      .withArgs(
        otherAccount.address,
        owner.address,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "Third signal from admin",
      )

    // Verify signal counter increased again
    expect(await veBetterPassport.signaledCounter(otherAccount.address)).to.equal(3)
  })

  it("Should check isPerson status after being signaled by multiple apps", async function () {
    const { x2EarnApps, otherAccounts, owner, veBetterPassport } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    // User to be signaled
    const user = otherAccounts[2]

    // Create first app
    await x2EarnApps
      .connect(owner)
      .submitApp(otherAccounts[0].address, otherAccounts[0].address, otherAccounts[0].address, "metadataURI1")

    const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
    await endorseApp(app1Id, otherAccounts[0])

    // Create second app
    await x2EarnApps
      .connect(owner)
      .submitApp(otherAccounts[1].address, otherAccounts[1].address, otherAccounts[1].address, "metadataURI2")

    const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))
    await endorseApp(app2Id, otherAccounts[1])

    // Create a third app for participation
    await x2EarnApps
      .connect(owner)
      .submitApp(otherAccounts[5].address, otherAccounts[5].address, otherAccounts[5].address, "metadataURI3")

    const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[5].address))
    await endorseApp(app3Id, otherAccounts[5])

    await bootstrapAndStartEmissions()

    // Set app3 security level to LOW
    await veBetterPassport.connect(owner).setAppSecurity(app3Id, 1)

    // Set participation score threshold
    await veBetterPassport.connect(owner).setThresholdPoPScore(100)

    // Enable participation score check
    await veBetterPassport.connect(owner).toggleCheck(4)

    // Register actions for the user to build participation score
    await veBetterPassport.connect(owner).grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)

    // Register actions for the user to build participation score
    await veBetterPassport.connect(owner).registerAction(user.address, app3Id) // 100 points

    expect(await veBetterPassport.userRoundScore(user, 1)).to.equal(100)

    expect(await veBetterPassport.getCumulativeScoreWithDecay(user, 1)).to.equal(100)

    // Verify user has sufficient participation score and is a person
    const [isPerson, reason] = await veBetterPassport.isPerson(user.address)
    expect(isPerson).to.be.true
    expect(reason).to.equal("User's participation score is above the threshold")

    // Set signaling threshold to 3
    await veBetterPassport.connect(owner).setSignalingThreshold(3)

    // Enable signaling check
    await veBetterPassport.connect(owner).toggleCheck(3)

    // Verify user is still a person after enabling signaling check but before any signals
    const [isPersonAfterChecksEnabled, reasonAfterChecksEnabled] = await veBetterPassport.isPerson(user.address)
    expect(isPersonAfterChecksEnabled).to.be.true
    expect(reasonAfterChecksEnabled).to.equal("User's participation score is above the threshold")

    // Assign signalers for both apps
    await veBetterPassport.connect(otherAccounts[0]).assignSignalerToAppByAppAdmin(app1Id, otherAccounts[3].address)
    await veBetterPassport.connect(otherAccounts[1]).assignSignalerToAppByAppAdmin(app2Id, otherAccounts[4].address)

    // First app signals the user
    await veBetterPassport.connect(otherAccounts[3]).signalUser(user.address)

    // Verify signal was counted
    expect(await veBetterPassport.signaledCounter(user.address)).to.equal(1)
    expect(await veBetterPassport.appSignalsCounter(app1Id, user.address)).to.equal(1)

    // Check isPerson after first signal - should still be a person
    const [isPerson1, reason1] = await veBetterPassport.isPerson(user.address)
    expect(isPerson1).to.be.true
    expect(reason1).to.equal("User's participation score is above the threshold")

    // Second app signals the user
    await veBetterPassport.connect(otherAccounts[4]).signalUser(user.address)

    // Verify signal was counted
    expect(await veBetterPassport.signaledCounter(user.address)).to.equal(2)
    expect(await veBetterPassport.appSignalsCounter(app2Id, user.address)).to.equal(1)

    // Check isPerson after second signal - should still be a person
    const [isPerson2, reason2] = await veBetterPassport.isPerson(user.address)
    expect(isPerson2).to.be.true
    expect(reason2).to.equal("User's participation score is above the threshold")

    // Add a third signal (from admin to avoid app restrictions)
    await veBetterPassport.connect(owner).signalUser(user.address)

    // Verify signal was counted
    expect(await veBetterPassport.signaledCounter(user.address)).to.equal(3)

    // Check isPerson after third signal - should no longer be a person
    const [isPerson3, reason3] = await veBetterPassport.isPerson(user.address)
    expect(isPerson3).to.be.false
    expect(reason3).to.equal("User has been signaled too many times")
  })
})
