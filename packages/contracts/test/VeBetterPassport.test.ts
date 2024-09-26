import { ethers } from "hardhat"
import { expect } from "chai"
import {
  bootstrapAndStartEmissions,
  bootstrapEmissions,
  createNodeHolder,
  createProposal,
  linkEntityToPassportWithSignature,
  getOrDeployContractInstances,
  getProposalIdFromTx,
  getVot3Tokens,
  payDeposit,
  startNewAllocationRound,
  waitForNextCycle,
  waitForProposalToBeActive,
  delegateWithSignature,
} from "./helpers"
import { describe, it } from "mocha"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"

describe.only("VeBetterPassport - @shard3", function () {
  describe("Contract parameters", function () {
    it("Should have contract addresses set correctly", async function () {
      const { veBetterPassport, x2EarnApps, xAllocationVoting, nodeManagement, galaxyMember } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Verify contract addresses
      expect(await veBetterPassport.getXAllocationVoting()).to.equal(await xAllocationVoting.getAddress())
      expect(await veBetterPassport.getX2EarnApps()).to.equal(await x2EarnApps.getAddress())
      expect(await veBetterPassport.getNodeManagement()).to.equal(await nodeManagement.getAddress())
      expect(await veBetterPassport.getGalaxyMember()).to.equal(await galaxyMember.getAddress())
    })

    it("Should have correct roles set", async function () {
      const { veBetterPassport, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await veBetterPassport.hasRole(await veBetterPassport.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true
      expect(await veBetterPassport.hasRole(await veBetterPassport.SETTINGS_MANAGER_ROLE(), owner.address)).to.be.true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ROLE_GRANTER(), owner.address)).to.be.true
      expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), owner.address)).to.be.true
      expect(await veBetterPassport.hasRole(await veBetterPassport.WHITELISTER_ROLE(), owner.address)).to.be.true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
    })

    it("Should have action score thresholds set correctly", async function () {
      const config = createLocalConfig()
      const { veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
        config: {
          ...config,
          VEPASSPORT_PARTICIPATION_SCORE_THRESHOLD: 100,
          VEPASSPORT_BOT_SIGNALING_THRESHOLD: 5,
        },
      })

      expect(await veBetterPassport.thresholdParticipationScore()).to.equal(100)
      expect(await veBetterPassport.signalingThreshold()).to.equal(5)
    })

    it("Should have rounds for cumulative score set correctly", async function () {
      const config = createLocalConfig()
      const { veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
        config: {
          ...config,
          VEPASSPORT_ROUNDS_FOR_CUMULATIVE_PARTICIPATION_SCORE: 5,
        },
      })

      expect(await veBetterPassport.roundsForCumulativeScore()).to.equal(5)
    })

    it("Should have minimum galaxy member level set correctly", async function () {
      const config = createLocalConfig()
      const { veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
        config: {
          ...config,
          VEPASSPORT_GALAXY_MEMBER_MINIMUM_LEVEL: 5,
        },
      })

      expect(await veBetterPassport.getMinimumGalaxyMemberLevel()).to.equal(5)
    })
  })
  // deployment
  describe("Upgrades", function () {
    it("Should not be able to initialize twice", async function () {
      const config = createLocalConfig()
      const { veBetterPassport, owner, x2EarnApps, xAllocationVoting, nodeManagement, galaxyMember } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      await expect(
        veBetterPassport.initialize(
          {
            x2EarnApps: await x2EarnApps.getAddress(),
            xAllocationVoting: await xAllocationVoting.getAddress(),
            nodeManagement: await nodeManagement.getAddress(),
            galaxyMember: await galaxyMember.getAddress(),
            popScoreThreshold: config.VEPASSPORT_PARTICIPATION_SCORE_THRESHOLD, //threshold
            signalingThreshold: config.VEPASSPORT_BOT_SIGNALING_THRESHOLD, //signalingThreshold
            roundsForCumulativeScore: config.VEPASSPORT_ROUNDS_FOR_CUMULATIVE_PARTICIPATION_SCORE, //roundsForCumulativeScore
            minimumGalaxyMemberLevel: config.VEPASSPORT_GALAXY_MEMBER_MINIMUM_LEVEL, //galaxyMemberMinimumLevel
            roundsForAssigningEntityScore: config.VEPASSPORT_ROUNDS_FOR_ASSIGNING_ENTITY_SCORE, //roundsForAssigningEntityScore
            blacklistThreshold: config.VEPASSPORT_BLACKLIST_THRESHOLD, //blacklistThreshold
            whitelistThreshold: config.VEBETTER_WHITELIST_THRESHOLD, //whitelistThreshold
            maxEntitiesPerPassport: config.VEBETTER_PASSPORT_MAX_ENTITIES, //maxEntitiesPerPassport
          },
          {
            admin: owner.address, // admin
            botSignaler: owner.address, // botSignaler
            upgrader: owner.address, // upgrader
            settingsManager: owner.address, // settingsManager
            roleGranter: owner.address, // roleGranter
            blacklister: owner.address, // blacklister
            whitelister: owner.address, // whitelistManager
            actionRegistrar: owner.address, // actionRegistrar
            actionScoreManager: owner.address, // actionScoreManager
          },
        ),
      ).to.be.reverted
    })

    it("Should not be able to upgrade if without UPGRADER_ROLE", async function () {
      const {
        veBetterPassport,
        otherAccount,
        passportChecksLogic,
        passportConfigurator,
        passportDelegationLogic,
        passportPersonhoodLogic,
        passportPoPScoreLogic,
        passportSignalingLogic,
        passportEntityLogic,
        passportWhitelistBlacklistLogic,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("VeBetterPassport", {
        libraries: {
          PassportChecksLogic: await passportChecksLogic.getAddress(),
          PassportConfigurator: await passportConfigurator.getAddress(),
          PassportEntityLogic: await passportEntityLogic.getAddress(),
          PassportPersonhoodLogic: await passportPersonhoodLogic.getAddress(),
          PassportPoPScoreLogic: await passportPoPScoreLogic.getAddress(),
          PassportDelegationLogic: await passportDelegationLogic.getAddress(),
          PassportSignalingLogic: await passportSignalingLogic.getAddress(),
          PassportWhitelistAndBlacklistLogic: await passportWhitelistBlacklistLogic.getAddress(),
        },
      })

      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const UPGRADER_ROLE = await veBetterPassport.UPGRADER_ROLE()
      expect(await veBetterPassport.hasRole(UPGRADER_ROLE, otherAccount)).to.eql(false)

      await expect(veBetterPassport.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to
        .be.reverted
    })

    it("User with UPGRADER_ROLE should be able to upgrade the contract", async function () {
      const {
        owner,
        veBetterPassport,
        passportChecksLogic,
        passportConfigurator,
        passportDelegationLogic,
        passportPersonhoodLogic,
        passportPoPScoreLogic,
        passportEntityLogic,
        passportSignalingLogic,
        passportWhitelistBlacklistLogic,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("VeBetterPassport", {
        libraries: {
          PassportChecksLogic: await passportChecksLogic.getAddress(),
          PassportConfigurator: await passportConfigurator.getAddress(),
          PassportEntityLogic: await passportEntityLogic.getAddress(),
          PassportPersonhoodLogic: await passportPersonhoodLogic.getAddress(),
          PassportPoPScoreLogic: await passportPoPScoreLogic.getAddress(),
          PassportDelegationLogic: await passportDelegationLogic.getAddress(),
          PassportSignalingLogic: await passportSignalingLogic.getAddress(),
          PassportWhitelistAndBlacklistLogic: await passportWhitelistBlacklistLogic.getAddress(),
        },
      })
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await veBetterPassport.getAddress())

      const UPGRADER_ROLE = await veBetterPassport.UPGRADER_ROLE()
      expect(await veBetterPassport.hasRole(UPGRADER_ROLE, owner.address)).to.eql(true)

      await expect(veBetterPassport.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await veBetterPassport.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Only user with UPGRADER_ROLE should be able to upgrade the contract", async function () {
      const {
        owner,
        veBetterPassport,
        otherAccount,
        passportChecksLogic,
        passportConfigurator,
        passportDelegationLogic,
        passportPersonhoodLogic,
        passportPoPScoreLogic,
        passportSignalingLogic,
        passportWhitelistBlacklistLogic,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("VeBetterPassport", {
        libraries: {
          PassportChecksLogic: await passportChecksLogic.getAddress(),
          PassportConfigurator: await passportConfigurator.getAddress(),
          PassportEntityLogic: await passportDelegationLogic.getAddress(),
          PassportDelegationLogic: await passportDelegationLogic.getAddress(),
          PassportPersonhoodLogic: await passportPersonhoodLogic.getAddress(),
          PassportPoPScoreLogic: await passportPoPScoreLogic.getAddress(),
          PassportSignalingLogic: await passportSignalingLogic.getAddress(),
          PassportWhitelistAndBlacklistLogic: await passportWhitelistBlacklistLogic.getAddress(),
        },
      })
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await veBetterPassport.getAddress())

      await veBetterPassport.revokeRole(await veBetterPassport.UPGRADER_ROLE(), owner.address) // Revoke the UPGRADER_ROLE from the owner

      expect(await veBetterPassport.hasRole(await veBetterPassport.UPGRADER_ROLE(), owner.address)).to.eql(false)

      await veBetterPassport.grantRole(await veBetterPassport.UPGRADER_ROLE(), otherAccount.address) // Grant the UPGRADER_ROLE to the otherAccount

      // Upgrade the VeBetterPassport implementation with NON-UPGRADER_ROLE user
      await expect(veBetterPassport.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.be
        .reverted

      // Upgrade the VeBetterPassport implementation with UPGRADER_ROLE user
      await expect(veBetterPassport.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to
        .not.be.reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await veBetterPassport.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    /*
     Note that when VeBetterPassport is upgraded to a version > 1, we should test also:
      - that the new contract is initialized correctly
      - that the new contract's version is returned correctly
      - that there is no storage conflict between the old and new contract
    */
  })

  describe("PersonhoodSettings", function () {
    it("Should initialize correctly", async function () {
      const {
        owner: settingsManager,
        veBetterPassport,
        otherAccount,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Verify non admin account cannot toggle checks by default
      await expect(veBetterPassport.connect(otherAccount).toggleCheck(1)).to.be.reverted

      const settingsManagerRole = await veBetterPassport.SETTINGS_MANAGER_ROLE()

      // Verify settingsManager has the role
      expect(await veBetterPassport.hasRole(settingsManagerRole, settingsManager.address)).to.be.true
    })

    it("Should allow only settings manager to toggle checks", async function () {
      const {
        owner: settingsManager,
        veBetterPassport,
        otherAccount,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })
      await expect(veBetterPassport.connect(otherAccount).toggleCheck(1)).to.be.reverted

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleCheck(1)) // 1 is the
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Whitelist Check", true)

      // Whitelist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true

      // Cast SETTING_MANAGER_ROLE to otherAccount
      const settingsManagerRole = await veBetterPassport.SETTINGS_MANAGER_ROLE()
      await veBetterPassport.connect(settingsManager).grantRole(settingsManagerRole, otherAccount.address)

      // Other account should be able to toggle the checks
      await expect(veBetterPassport.connect(otherAccount).toggleCheck(1))
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Whitelist Check", false)

      // Whitelist check should be disabled
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.false
    })

    it("Should be able to toggle whitelist check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Whitelist check should be disabled by default
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleCheck(1))
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Whitelist Check", true)

      // Whitelist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true
    })

    it("Should be able to toggle blacklist check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Blacklist check should be disabled by default
      expect(await veBetterPassport.isCheckEnabled(2)).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleCheck(2))
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Blacklist Check", true)

      // Blacklist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(2)).to.be.true
    })

    it("Should be able to toggle signaling check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Signaling check should be disabled by default
      expect(await veBetterPassport.isCheckEnabled(3)).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleCheck(3))
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Signaling Check", true)

      // Signaling check should be enabled
      expect(await veBetterPassport.isCheckEnabled(3)).to.be.true
    })

    it("Should be able to toggle participation check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Participation check should be disabled by default
      expect(await veBetterPassport.isCheckEnabled(4)).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleCheck(4))
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Participation Score Check", true)

      // Participation check should be enabled
      expect(await veBetterPassport.isCheckEnabled(4)).to.be.true
    })

    it("Should be able to toggle node ownership check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Node ownership check should be disabled by default
      expect(await veBetterPassport.isCheckEnabled(5)).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleCheck(5))
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Node Ownership Check", true)

      // Node ownership check should be enabled
      expect(await veBetterPassport.isCheckEnabled(5)).to.be.true
    })

    it("Should be able to toggle gm ownership check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Whitelist check should be disabled by default
      expect(await veBetterPassport.isCheckEnabled(6)).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleCheck(6))
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("GM Ownership Check", true)

      // Whitelist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(6)).to.be.true
    })

    it("Should be able to set the minimum galaxy member level", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Set the minimum galaxy member level
      await expect(veBetterPassport.connect(settingsManager).setMinimumGalaxyMemberLevel(5))
        .to.emit(veBetterPassport, "MinimumGalaxyMemberLevelSet")
        .withArgs(5)

      // Verify the minimum galaxy member level
      expect(await veBetterPassport.getMinimumGalaxyMemberLevel()).to.equal(5)
    })
  })

  describe("Signalers management", function () {
    it("Admin of App can assigner and revoker a signaler", async function () {
      const { x2EarnApps, otherAccounts, otherAccount, owner, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const appAdmin = otherAccounts[0]

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, appAdmin, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await expect(veBetterPassport.connect(appAdmin).assignSignalerToAppByAppAdmin(appId, otherAccount.address))
        .to.emit(veBetterPassport, "SignalerAssignedToApp")
        .withArgs(otherAccount.address, appId)

      expect(await veBetterPassport.appOfSignaler(otherAccount.address)).to.equal(appId)

      await expect(veBetterPassport.connect(appAdmin).removeSignalerFromAppByAppAdmin(otherAccount.address))
        .to.emit(veBetterPassport, "SignalerRemovedFromApp")
        .withArgs(otherAccount.address, appId)

      expect(await veBetterPassport.appOfSignaler(otherAccount.address)).to.equal(ethers.ZeroHash)
    })

    it("Non-Admin of an app cannot add a signaler", async function () {
      const { x2EarnApps, otherAccounts, otherAccount, owner, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const appAdmin = otherAccounts[0]

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, appAdmin, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await expect(veBetterPassport.connect(otherAccount).assignSignalerToAppByAppAdmin(appId, otherAccount.address)).to
        .be.reverted
    })

    it("ROLE_GRANTER can add and remove app signalers", async function () {
      const { x2EarnApps, otherAccounts, otherAccount, owner, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const appAdmin = otherAccounts[0]

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, appAdmin, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await expect(veBetterPassport.connect(owner).assignSignalerToApp(appId, otherAccount.address)) // Differs from `assignSignalerToAppByAppAdmin`
        .to.emit(veBetterPassport, "SignalerAssignedToApp")
        .withArgs(otherAccount.address, appId)

      expect(await veBetterPassport.appOfSignaler(otherAccount.address)).to.equal(appId)

      await expect(veBetterPassport.connect(owner).removeSignalerFromApp(otherAccount.address)) // Differs from `removeSignalerFromAppByAppAdmin`
        .to.emit(veBetterPassport, "SignalerRemovedFromApp")
        .withArgs(otherAccount.address, appId)

      expect(await veBetterPassport.appOfSignaler(otherAccount.address)).to.equal(ethers.ZeroHash)
    })

    it("Signaler can signal a user", async function () {
      const { veBetterPassport, otherAccount, owner, otherAccounts, x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const appAdmin = otherAccounts[0]

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, appAdmin, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await expect(veBetterPassport.connect(appAdmin).assignSignalerToAppByAppAdmin(appId, otherAccount.address))
        .to.emit(veBetterPassport, "SignalerAssignedToApp")
        .withArgs(otherAccount.address, appId)

      expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), otherAccount.address)).to.be.true

      await expect(veBetterPassport.connect(otherAccount).signalUser(owner.address))
        .to.emit(veBetterPassport, "UserSignaled")
        .withArgs(owner.address, otherAccount.address, appId, "")

      expect(await veBetterPassport.signaledCounter(owner.address)).to.equal(1)
      expect(await veBetterPassport.appSignalsCounter(appId, owner.address)).to.equal(1)

      await expect(veBetterPassport.connect(appAdmin).removeSignalerFromAppByAppAdmin(otherAccount.address))
        .to.emit(veBetterPassport, "SignalerRemovedFromApp")
        .withArgs(otherAccount.address, appId)

      await expect(veBetterPassport.connect(otherAccount).signalUser(owner.address)).to.be.reverted
    })

    it("DEFAULT_ADMIN_ROLE can reset signals of a user", async function () {
      const { veBetterPassport, otherAccount, owner, otherAccounts, x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const appAdmin = otherAccounts[0]

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, appAdmin, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await expect(veBetterPassport.connect(appAdmin).assignSignalerToAppByAppAdmin(appId, otherAccount.address))
        .to.emit(veBetterPassport, "SignalerAssignedToApp")
        .withArgs(otherAccount.address, appId)

      expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), otherAccount.address)).to.be.true

      await expect(veBetterPassport.connect(otherAccount).signalUser(owner.address))
        .to.emit(veBetterPassport, "UserSignaled")
        .withArgs(owner.address, otherAccount.address, appId, "")

      expect(await veBetterPassport.signaledCounter(owner.address)).to.equal(1)
      expect(await veBetterPassport.appSignalsCounter(appId, owner.address)).to.equal(1)

      await expect(
        veBetterPassport
          .connect(owner)
          .resetUserSignalsWithReason(owner.address, "User demonstrated erroneous signaling"),
      )
        .to.emit(veBetterPassport, "UserSignalsReset")
        .withArgs(owner.address, "User demonstrated erroneous signaling")

      expect(await veBetterPassport.signaledCounter(owner.address)).to.equal(0)

      // App signals remains 1 so we keep stored the number of signals occurred in the past
      expect(await veBetterPassport.appSignalsCounter(appId, owner.address)).to.equal(1)
    })

    it("Should not be able to reset signals without DEFAULT_ADMIN_ROLE", async function () {
      const { veBetterPassport, otherAccount, owner, otherAccounts, x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const appAdmin = otherAccounts[0]

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, appAdmin, otherAccounts[0].address, "metadataURI")

      const appId = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))

      await expect(veBetterPassport.connect(appAdmin).assignSignalerToAppByAppAdmin(appId, otherAccount.address))
        .to.emit(veBetterPassport, "SignalerAssignedToApp")
        .withArgs(otherAccount.address, appId)

      expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), otherAccount.address)).to.be.true

      await expect(veBetterPassport.connect(otherAccount).signalUser(owner.address))
        .to.emit(veBetterPassport, "UserSignaled")
        .withArgs(owner.address, otherAccount.address, appId, "")

      expect(await veBetterPassport.signaledCounter(owner.address)).to.equal(1)
      expect(await veBetterPassport.appSignalsCounter(appId, owner.address)).to.equal(1)

      await expect(
        veBetterPassport
          .connect(otherAccount)
          .resetUserSignalsWithReason(owner.address, "User demonstrated erroneous signaling"),
      ).to.be.reverted
    })

    it("App admin should be able to reset signals of a user and total signals should be tracked correctly", async function () {
      const { veBetterPassport, otherAccount, owner, otherAccounts, x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[0].address, otherAccount, otherAccounts[0].address, "metadataURI")

      await x2EarnApps.connect(owner).addApp(otherAccounts[1].address, owner, otherAccounts[1].address, "metadataURI")

      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[0].address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[1].address))

      await expect(veBetterPassport.connect(otherAccount).assignSignalerToAppByAppAdmin(app1Id, otherAccount.address))
        .to.emit(veBetterPassport, "SignalerAssignedToApp")
        .withArgs(otherAccount.address, app1Id)
      expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), otherAccount.address)).to.be.true

      await expect(veBetterPassport.connect(owner).assignSignalerToAppByAppAdmin(app2Id, owner.address))
        .to.emit(veBetterPassport, "SignalerAssignedToApp")
        .withArgs(owner.address, app2Id)
      expect(await veBetterPassport.hasRole(await veBetterPassport.SIGNALER_ROLE(), owner.address)).to.be.true

      // Signal user with app1Id
      await expect(veBetterPassport.connect(otherAccount).signalUser(owner.address))
        .to.emit(veBetterPassport, "UserSignaled")
        .withArgs(owner.address, otherAccount.address, app1Id, "")
      await expect(veBetterPassport.connect(otherAccount).signalUser(owner.address))
        .to.emit(veBetterPassport, "UserSignaled")
        .withArgs(owner.address, otherAccount.address, app1Id, "")

      // Signal user with app2Id
      await expect(veBetterPassport.connect(owner).signalUser(owner.address))
        .to.emit(veBetterPassport, "UserSignaled")
        .withArgs(owner.address, owner.address, app2Id, "")

      expect(await veBetterPassport.signaledCounter(owner.address)).to.equal(3) // 2 signals from app1Id and 1 signal from app2Id
      expect(await veBetterPassport.appSignalsCounter(app1Id, owner.address)).to.equal(2) // 2 signals from app1Id
      expect(await veBetterPassport.appSignalsCounter(app2Id, owner.address)).to.equal(1) // 1 signal from app2Id

      // Reset signals of user by app1Id
      await expect(
        veBetterPassport
          .connect(otherAccount)
          .resetUserSignalsByAppAdminWithReason(owner.address, "User demonstrated erroneous signaling"),
      )
        .to.emit(veBetterPassport, "UserSignalsResetForApp")
        .withArgs(owner.address, app1Id, "User demonstrated erroneous signaling")

      expect(await veBetterPassport.signaledCounter(owner.address)).to.equal(1) // 1 signal from app2Id
      expect(await veBetterPassport.appSignalsCounter(app1Id, owner.address)).to.equal(0) // 0 signals from app1Id
    })
  })

  describe.only("Passport Entities", function () {
    it("Should be able to register an entity by function calls", async function () {
      const {
        veBetterPassport,
        owner: passport,
        otherAccount: entity,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(veBetterPassport.connect(entity).linkEntityToPassport(passport.address))
        .to.emit(veBetterPassport, "LinkPending")
        .withArgs(entity.address, passport.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Expect pending link
      expect((await veBetterPassport.getPendingEntitiesForPassport(passport.address)).length).to.equal(1)

      // Approve the entity
      await expect(veBetterPassport.connect(passport).acceptEntityLink(entity.address))
        .to.emit(veBetterPassport, "LinkCreated")
        .withArgs(entity.address, passport.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.true
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.equal(true)
      // Expect no pending link
      expect((await veBetterPassport.getPendingEntitiesForPassport(passport.address)).length).to.equal(0)
    })

    it("Should be able to register an entity by signature", async function () {
      const {
        veBetterPassport,
        owner: passport,
        otherAccount: entity,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.be.true
      // No entity is linked to the passport
      expect(await veBetterPassport.getEntitiesLinkedToPassport(passport.address)).to.be.empty

      // Approve the entity
      // await veBetterPassport.delegateWithSignature(other)
      // Set up EIP-712 domain
      const domain = {
        name: "VeBetterPassport",
        version: "1",
        chainId: 1337,
        verifyingContract: await veBetterPassport.getAddress(),
      }
      let types = {
        LinkEntity: [
          { name: "entity", type: "address" },
          { name: "passport", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      }

      // Define a deadline timestamp
      const currentBlock = await ethers.provider.getBlockNumber()
      const block = await ethers.provider.getBlock(currentBlock)

      if (!block) {
        throw new Error("Block not found")
      }

      const deadline = block.timestamp + 3600 // 1 hour from
      // Prepare the struct to sign
      const linkData = {
        entity: entity.address,
        passport: passport.address,
        deadline: deadline,
      }

      // Create the EIP-712 signature for the delegator
      const signature = await entity.signTypedData(domain, types, linkData)

      // Perform the delegation using the signature
      await expect(
        veBetterPassport.connect(passport).linkEntityToPassportWithSignature(entity.address, deadline, signature),
      )
        .to.emit(veBetterPassport, "LinkCreated")
        .withArgs(entity.address, passport.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.true
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.equal(true)
      expect(await veBetterPassport.getEntitiesLinkedToPassport(passport.address)).to.have.lengthOf(1)
    })

    it("Should be ale to link multiple entities to pasport", async function () {
      const {
        veBetterPassport,
        owner: passport,
        otherAccounts,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const entity1 = otherAccounts[0]
      const entity2 = otherAccounts[1]
      const entity3 = otherAccounts[2]

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity1.address)).to.be.false
      expect(await veBetterPassport.isEntity(entity2.address)).to.be.false
      expect(await veBetterPassport.isEntity(entity3.address)).to.be.false

      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.be.true
      expect(await veBetterPassport.getEntitiesLinkedToPassport(passport.address)).to.be.empty

      await linkEntityToPassportWithSignature(veBetterPassport, passport, entity1, 1000)
      await linkEntityToPassportWithSignature(veBetterPassport, passport, entity2, 1000)
      await linkEntityToPassportWithSignature(veBetterPassport, passport, entity3, 1000)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity1.address)).to.be.true
      expect(await veBetterPassport.isEntity(entity2.address)).to.be.true
      expect(await veBetterPassport.isEntity(entity3.address)).to.be.true

      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.equal(true)
      expect(await veBetterPassport.getEntitiesLinkedToPassport(passport.address)).to.have.lengthOf(3)
    })

    it("Should be able to unlink an entity from a passport", async function () {
      const {
        veBetterPassport,
        owner: passport,
        otherAccount: entity,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.be.true

      // Approve the entity
      await expect(veBetterPassport.connect(entity).linkEntityToPassport(passport.address))
        .to.emit(veBetterPassport, "LinkPending")
        .withArgs(entity.address, passport.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Expect pending link
      expect((await veBetterPassport.getPendingEntitiesForPassport(passport.address)).length).to.equal(1)

      // Approve the entity
      await expect(veBetterPassport.connect(passport).acceptEntityLink(entity.address))
        .to.emit(veBetterPassport, "LinkCreated")
        .withArgs(entity.address, passport.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.true
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.equal(true)
      // Expect no pending link
      expect((await veBetterPassport.getPendingEntitiesForPassport(passport.address)).length).to.equal(0)

      // Unlink the entity
      await expect(veBetterPassport.connect(passport).removeEntityLink(entity.address))
        .to.emit(veBetterPassport, "LinkRemoved")
        .withArgs(entity.address, passport.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.be.true
    })

    it("Should be able to unlink multiple entities from a passport", async function () {
      const {
        veBetterPassport,
        owner: passport,
        otherAccounts,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const entity1 = otherAccounts[0]
      const entity2 = otherAccounts[1]
      const entity3 = otherAccounts[2]

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity1.address)).to.be.false
      expect(await veBetterPassport.isEntity(entity2.address)).to.be.false
      expect(await veBetterPassport.isEntity(entity3.address)).to.be.false

      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.be.true
      expect(await veBetterPassport.getEntitiesLinkedToPassport(passport.address)).to.be.empty

      await linkEntityToPassportWithSignature(veBetterPassport, passport, entity1, 1000)
      await linkEntityToPassportWithSignature(veBetterPassport, passport, entity2, 1000)
      await linkEntityToPassportWithSignature(veBetterPassport, passport, entity3, 1000)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity1.address)).to.be.true
      expect(await veBetterPassport.isEntity(entity2.address)).to.be.true
      expect(await veBetterPassport.isEntity(entity3.address)).to.be.true

      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.equal(true)
      expect(await veBetterPassport.getEntitiesLinkedToPassport(passport.address)).to.have.lengthOf(3)

      // Unlink the entities
      await expect(veBetterPassport.connect(passport).removeEntityLink(entity1.address))
        .to.emit(veBetterPassport, "LinkRemoved")
        .withArgs(entity1.address, passport.address)
      await expect(veBetterPassport.connect(passport).removeEntityLink(entity2.address))
        .to.emit(veBetterPassport, "LinkRemoved")
        .withArgs(entity2.address, passport.address)
      await expect(veBetterPassport.connect(passport).removeEntityLink(entity3.address))
        .to.emit(veBetterPassport, "LinkRemoved")
        .withArgs(entity3.address, passport.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity1.address)).to.be.false
      expect(await veBetterPassport.isEntity(entity2.address)).to.be.false
      expect(await veBetterPassport.isEntity(entity3.address)).to.be.false

      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.be.true
      expect(await veBetterPassport.getEntitiesLinkedToPassport(passport.address)).to.be.empty
    })

    it("Should be able to cancel a pending entity link", async function () {
      const {
        veBetterPassport,
        owner: passport,
        otherAccount: entity,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.be.true

      // Approve the entity
      await expect(veBetterPassport.connect(entity).linkEntityToPassport(passport.address))
        .to.emit(veBetterPassport, "LinkPending")
        .withArgs(entity.address, passport.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Expect pending link
      expect((await veBetterPassport.getPendingEntitiesForPassport(passport.address)).length).to.equal(1)

      // Cancel the pending link
      await expect(veBetterPassport.connect(passport).removePendingEntityLinkFromPassport(entity.address))
        .to.emit(veBetterPassport, "LinkRemoved")
        .withArgs(entity.address, passport.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport.address)).to.be.true
      // Expect no pending link
      expect((await veBetterPassport.getPendingEntitiesForPassport(passport.address)).length).to.equal(0)
    })

    it("Should not be able to assign an entity to a passport if the entity is already linked to another passport", async function () {
      const {
        veBetterPassport,
        owner: passport1,
        otherAccounts,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const entity = otherAccounts[0]
      const passport2 = otherAccounts[1]

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport1.address)).to.be.true
      expect(await veBetterPassport.isPassport(passport2.address)).to.be.true

      expect(await veBetterPassport.getEntitiesLinkedToPassport(passport1.address)).to.be.empty
      expect(await veBetterPassport.getEntitiesLinkedToPassport(passport2.address)).to.be.empty

      // Approve the entity
      await expect(veBetterPassport.connect(entity).linkEntityToPassport(passport1.address))
        .to.emit(veBetterPassport, "LinkPending")
        .withArgs(entity.address, passport1.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.false
      // Expect pending link
      expect((await veBetterPassport.getPendingEntitiesForPassport(passport1.address)).length).to.equal(1)

      // Approve the entity
      await expect(veBetterPassport.connect(passport1).acceptEntityLink(entity.address))
        .to.emit(veBetterPassport, "LinkCreated")
        .withArgs(entity.address, passport1.address)

      // Check if entity is linked to a passport
      expect(await veBetterPassport.isEntity(entity.address)).to.be.true
      // Check if passport is linked to an entity
      expect(await veBetterPassport.isPassport(passport1.address)).to.be.true
      expect(await veBetterPassport.isPassport(passport2.address)).to.be.true
      // Expect no pending link
      expect((await veBetterPassport.getPendingEntitiesForPassport(passport1.address)).length).to.equal(0)

      // Try to link the entity to another passport
      await expect(
        veBetterPassport.connect(entity).linkEntityToPassport(passport2.address),
      ).to.be.revertedWithCustomError(veBetterPassport, "AlreadyLinked")
    })
  })

  describe("PassportDelegation", function () {
    it("Should be able to delegate personhood with signature", async function () {
      const {
        xAllocationVoting,
        x2EarnApps,
        otherAccounts,
        owner,
        veBetterPassport,
        otherAccount: delegatee,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      otherAccounts.forEach(async account => {
        await getVot3Tokens(account, "10000")
      })
      await getVot3Tokens(delegatee, "10000")
      await getVot3Tokens(owner, "10000")

      // Whitelist owner
      await expect(veBetterPassport.connect(owner).whitelist(owner.address))
        .to.emit(veBetterPassport, "UserWhitelisted")
        .withArgs(owner.address, owner.address)
      await veBetterPassport.connect(owner).whitelist(otherAccounts[1].address)

      // Expect owner to be whitelisted
      expect(await veBetterPassport.isWhitelisted(owner.address)).to.be.true

      // Enable whitelist check
      await veBetterPassport.connect(owner).toggleCheck(1)

      // whitelist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true

      // expect owner to be person
      expect(await veBetterPassport.isPerson(owner.address)).to.deep.equal([true, "User is whitelisted"])

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[3].address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[4].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")

      // await veBetterPassport.delegateWithSignature(other)
      // Set up EIP-712 domain
      const domain = {
        name: "VeBetterPassport",
        version: "1",
        chainId: 1337,
        verifyingContract: await veBetterPassport.getAddress(),
      }
      let types = {
        Delegation: [
          { name: "delegator", type: "address" },
          { name: "delegatee", type: "address" },
          { name: "deadline", type: "uint256" },
        ],
      }

      // Define a deadline timestamp
      const currentBlock = await ethers.provider.getBlockNumber()
      const block = await ethers.provider.getBlock(currentBlock)

      if (!block) {
        throw new Error("Block not found")
      }

      const deadline = block.timestamp + 3600 // 1 hour from
      // Prepare the struct to sign
      const delegationData = {
        delegator: owner.address,
        delegatee: delegatee.address,
        deadline: deadline,
      }

      // Create the EIP-712 signature for the delegator
      const signature = await owner.signTypedData(domain, types, delegationData)

      // Perform the delegation using the signature
      await expect(veBetterPassport.connect(delegatee).delegateWithSignature(owner.address, deadline, signature))
        .to.emit(veBetterPassport, "DelegationCreated")
        .withArgs(owner.address, delegatee.address)

      // Verify that the delegatee has been assigned the delegator
      const storedDelegatee = await veBetterPassport.getDelegatee(owner.address)
      expect(storedDelegatee).to.equal(delegatee.address)

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, otherAccounts[4].address, "metadataURI")

      //Start allocation round
      const round1 = await startNewAllocationRound()
      // Vote
      await xAllocationVoting
        .connect(delegatee)
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )

      // Otheraccounts[1] has not delegated his passport and can vote
      await xAllocationVoting
        .connect(otherAccounts[1])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )
    })

    it("Should be able to delegate personhood", async function () {
      const {
        xAllocationVoting,
        x2EarnApps,
        otherAccounts,
        owner,
        veBetterPassport,
        otherAccount: delegatee,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      otherAccounts.forEach(async account => {
        await getVot3Tokens(account, "10000")
      })
      await getVot3Tokens(delegatee, "10000")
      await getVot3Tokens(owner, "10000")

      // Whitelist owner
      await expect(veBetterPassport.connect(owner).whitelist(owner.address))
        .to.emit(veBetterPassport, "UserWhitelisted")
        .withArgs(owner.address, owner.address)
      await veBetterPassport.connect(owner).whitelist(otherAccounts[1].address)

      // Expect owner to be whitelisted
      expect(await veBetterPassport.isWhitelisted(owner.address)).to.be.true

      // Enable whitelist check
      await veBetterPassport.connect(owner).toggleCheck(1)

      // whitelist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true

      // expect owner to be person
      expect(await veBetterPassport.isPerson(owner.address)).to.deep.equal([true, "User is whitelisted"])

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[3].address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[4].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")

      // delegate personhood
      await expect(veBetterPassport.connect(owner).delegatePassport(delegatee.address))
        .to.emit(veBetterPassport, "DelegationPending")
        .withArgs(owner.address, delegatee.address)

      // Check the pending delegation
      const pendingDelegation = await veBetterPassport.getPendingDelegations(delegatee.address)
      expect(pendingDelegation[0]).to.equal(owner.address)

      // Perform the delegation using the signature
      await expect(veBetterPassport.connect(delegatee).acceptDelegation(owner.address))
        .to.emit(veBetterPassport, "DelegationCreated")
        .withArgs(owner.address, delegatee.address)

      // Check the pending delegation
      const pendingDelegation2 = await veBetterPassport.getPendingDelegations(delegatee.address)
      expect(pendingDelegation2.length).to.equal(0)

      // Verify that the delegatee has been assigned the delegator
      const storedDelegatee = await veBetterPassport.getDelegatee(owner.address)
      expect(storedDelegatee).to.equal(delegatee.address)

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, otherAccounts[4].address, "metadataURI")

      //Start allocation round
      const round1 = await startNewAllocationRound()
      // Vote
      await xAllocationVoting
        .connect(delegatee)
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )

      // Otheraccounts[1] has not delegated his passport and can vote
      await xAllocationVoting
        .connect(otherAccounts[1])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )
    })

    it("Should be able to reject delegation request", async function () {
      const {
        xAllocationVoting,
        x2EarnApps,
        otherAccounts,
        owner,
        veBetterPassport,
        otherAccount: delegatee,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      otherAccounts.forEach(async account => {
        await getVot3Tokens(account, "10000")
      })
      await getVot3Tokens(delegatee, "10000")
      await getVot3Tokens(owner, "10000")

      // Whitelist owner
      await expect(veBetterPassport.connect(owner).whitelist(owner.address))
        .to.emit(veBetterPassport, "UserWhitelisted")
        .withArgs(owner.address, owner.address)
      await veBetterPassport.connect(owner).whitelist(otherAccounts[1].address)

      // Expect owner to be whitelisted
      expect(await veBetterPassport.isWhitelisted(owner.address)).to.be.true

      // Enable whitelist check
      await veBetterPassport.connect(owner).toggleCheck(1)

      // whitelist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true

      // expect owner to be person
      expect(await veBetterPassport.isPerson(owner.address)).to.deep.equal([true, "User is whitelisted"])

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[3].address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[4].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")

      // delegate personhood
      await expect(veBetterPassport.connect(owner).delegatePassport(delegatee.address))
        .to.emit(veBetterPassport, "DelegationPending")
        .withArgs(owner.address, delegatee.address)

      // Check the pending delegation
      const pendingDelegation = await veBetterPassport.getPendingDelegations(delegatee.address)
      expect(pendingDelegation[0]).to.equal(owner.address)

      // Perform the delegation using the signature
      await expect(veBetterPassport.connect(delegatee).removePendingDelegation(owner.address))
        .to.emit(veBetterPassport, "DelegationRevoked")
        .withArgs(owner.address, delegatee.address)

      // Check the pending delegation
      const pendingDelegation2 = await veBetterPassport.getPendingDelegations(delegatee.address)
      expect(pendingDelegation2.length).to.equal(0)

      // Owner can vote
      await expect(
        xAllocationVoting
          .connect(owner)
          .castVote(
            await startNewAllocationRound(),
            [app1Id, app2Id, app3Id],
            [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
          ),
      ).to.be.reverted
    })

    it("Should not be able to vote if delegating and not delegatee with allocation voting", async function () {
      const {
        xAllocationVoting,
        x2EarnApps,
        otherAccounts,
        owner,
        veBetterPassport,
        otherAccount: delegatee,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      await getVot3Tokens(delegatee, "10000")
      await getVot3Tokens(owner, "10000")

      // Whitelist owner
      await veBetterPassport.connect(owner).whitelist(owner.address)

      // Enable whitelist check
      await veBetterPassport.connect(owner).toggleCheck(1)

      // whitelist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true

      // expect owner to be person
      expect(await veBetterPassport.isPerson(owner.address)).to.deep.equal([true, "User is whitelisted"])

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[3].address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[4].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")

      // delegate with signature
      await delegateWithSignature(veBetterPassport, owner, delegatee, 3600)

      // Verify that the delegatee has been assigned the delegator
      const storedDelegatee = await veBetterPassport.getDelegatee(owner.address)
      expect(storedDelegatee).to.equal(delegatee.address)
      expect(await veBetterPassport.getDelegator(delegatee.address)).to.equal(owner.address)

      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, otherAccounts[4].address, "metadataURI")

      //Start allocation round
      const round1 = await startNewAllocationRound()

      // Vote
      await xAllocationVoting
        .connect(delegatee)
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )

      // Owner has delegated his passport and has no delegation to him (is not a delegatee) => owner can't vote
      await expect(
        xAllocationVoting
          .connect(owner)
          .castVote(
            round1,
            [app1Id, app2Id, app3Id],
            [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
          ),
      ).to.be.revertedWithCustomError(xAllocationVoting, "GovernorPersonhoodVerificationFailed")
    })

    it("Should not be able to vote if delegating and not delegatee with governor", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        owner,
        veBetterPassport,
        otherAccount: delegatee,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await getVot3Tokens(delegatee, "10000")
      await getVot3Tokens(owner, "10000")

      // Start emissions
      await bootstrapAndStartEmissions()

      // Whitelist owner
      await veBetterPassport.connect(owner).whitelist(owner.address)

      // Enable whitelist check
      await veBetterPassport.connect(owner).toggleCheck(1)

      // whitelist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true

      // expect owner to be person
      expect(await veBetterPassport.isPerson(owner.address)).to.deep.equal([true, "User is whitelisted"])

      // create a new proposal
      const tx = await createProposal(b3tr, B3trContract, owner, "Get b3tr token details", "tokenDetails", [])

      const proposalId = await getProposalIdFromTx(tx)

      // pay deposit
      await payDeposit(proposalId.toString(), owner)

      // Define a deadline timestamp
      const time = Date.now()
      const deadline = time + 3600 // 1 hour from now -> change from ms to s

      // delegate with signature
      await delegateWithSignature(veBetterPassport, owner, delegatee, deadline)

      // wait
      await waitForProposalToBeActive(proposalId)

      // Delegatee votes
      await governor.connect(delegatee).castVote(proposalId, 2) // vote abstain

      await expect(governor.connect(owner).castVote(proposalId, 2)).to.be.revertedWithCustomError(
        governor,
        "GovernorPersonhoodVerificationFailed",
      )
    })

    // If X delegates to Y, X can't vote. If Z delegates to X, X now can vote as he's a delegatee of Z.
    it("Should be able to vote if delegatee and delegator with governor", async function () {
      const {
        governor,
        b3tr,
        B3trContract,
        owner: X,
        veBetterPassport,
        otherAccount: Y,
        otherAccounts,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const Z = otherAccounts[0]

      await getVot3Tokens(X, "10000")
      await getVot3Tokens(Y, "10000")
      await getVot3Tokens(Z, "10000")

      // Start emissions
      await bootstrapAndStartEmissions()

      // Whitelist owner
      await veBetterPassport.connect(X).whitelist(X.address)
      await veBetterPassport.connect(X).whitelist(Z.address)

      // Enable whitelist check
      await veBetterPassport.connect(X).toggleCheck(1)

      // whitelist check should be enabled
      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true

      // expect owner to be person
      expect(await veBetterPassport.isPerson(X.address)).to.deep.equal([true, "User is whitelisted"])

      // create a new proposal
      const tx = await createProposal(b3tr, B3trContract, X, "Get b3tr token details", "tokenDetails", [])

      const proposalId = await getProposalIdFromTx(tx)

      // pay deposit
      await payDeposit(proposalId.toString(), X)

      // Define a deadline timestamp
      const time = Date.now()
      const deadline = time + 3600 // 1 hour from now -> change from ms to s

      // delegate with signature X to Y
      await delegateWithSignature(veBetterPassport, X, Y, deadline)

      // delegate with signature Z to X
      await delegateWithSignature(veBetterPassport, Z, X, deadline)

      // wait for proposal
      await waitForProposalToBeActive(proposalId)

      // Y can vote
      await governor.connect(Y).castVote(proposalId, 2) // vote abstain

      // X can vote even if he's a delegator to Y because X is delegatee of Z
      await governor.connect(X).castVote(proposalId, 2) // vote abstain

      // Z is delegator of X and has no delegators for him. Thus he can't vote.
      await expect(governor.connect(Z).castVote(proposalId, 2)).to.be.revertedWithCustomError(
        governor,
        "GovernorPersonhoodVerificationFailed",
      )
    })

    it("Should not be able to delegate to self", async function () {
      const { veBetterPassport, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(delegateWithSignature(veBetterPassport, owner, owner, 3600)).to.be.reverted
    })

    it("Should not be able to revoke delegation if not delegated", async function () {
      const { veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(veBetterPassport.revokeDelegation()).to.be.reverted
    })

    it("Should not be able to delegate with signature if signature expired", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(delegateWithSignature(veBetterPassport, owner, otherAccount, 0)).to.be.revertedWithCustomError(
        veBetterPassport,
        "SignatureExpired",
      )
    })

    it("Should not be able to delegate with invalid singature", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Set up EIP-712 domain
      const domain = {
        name: "PassportDelegation",
        version: "1",
        chainId: 1337,
        verifyingContract: await veBetterPassport.getAddress(),
      }
      let types = {
        Delegation: [
          { name: "wrong_field_1", type: "address" },
          { name: "wrong_field_2", type: "address" },
          { name: "wrong_field_3", type: "address" },
        ],
      }

      // Define a deadline timestamp
      const currentBlock = await ethers.provider.getBlockNumber()
      const block = await ethers.provider.getBlock(currentBlock)

      if (!block) {
        throw new Error("Block not found")
      }

      const deadline = block.timestamp + 3600 // 1 hour from

      // Prepare the struct to sign
      const delegationData = {
        wrong_field_1: owner.address,
        wrong_field_2: otherAccount.address,
        wrong_field_3: otherAccount.address,
      }

      // Create the EIP-712 signature for the delegator
      const signature = await owner.signTypedData(domain, types, delegationData)

      // Perform the delegation using the signature
      await expect(
        veBetterPassport.connect(otherAccount).delegateWithSignature(owner.address, deadline, signature),
      ).to.be.revertedWithCustomError(veBetterPassport, "InvaliedSignature")
    })

    it("If a delegator re-delegates its passport or delegatee accepts delegation of new passport it should update mappings", async function () {
      const { veBetterPassport, owner, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await delegateWithSignature(veBetterPassport, owner, otherAccount, 3600)

      expect(await veBetterPassport.getDelegatee(owner.address)).to.equal(otherAccount.address)
      expect(await veBetterPassport.getDelegator(otherAccount.address)).to.equal(owner.address)

      await delegateWithSignature(veBetterPassport, otherAccounts[0], otherAccount, 3600)

      expect(await veBetterPassport.getDelegatee(owner.address)).to.equal(ethers.ZeroAddress)
      expect(await veBetterPassport.getDelegator(otherAccount.address)).to.equal(otherAccounts[0].address)
      expect(await veBetterPassport.getDelegatee(otherAccounts[0].address)).to.equal(otherAccount.address)
    })

    it("Should be able to revoke delegation as delegatee", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await delegateWithSignature(veBetterPassport, owner, otherAccount, 3600)

      await expect(veBetterPassport.revokeDelegation()).to.emit(veBetterPassport, "DelegationRevoked")
      expect(await veBetterPassport.getDelegatee(owner.address)).to.equal(ethers.ZeroAddress)
      expect(await veBetterPassport.getDelegator(otherAccount.address)).to.equal(ethers.ZeroAddress)
    })

    it("Should be able to revoke delegation as delegator", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await delegateWithSignature(veBetterPassport, owner, otherAccount, 3600)

      await expect(veBetterPassport.revokeDelegation()).to.emit(veBetterPassport, "DelegationRevoked")
      expect(await veBetterPassport.getDelegatee(owner.address)).to.equal(ethers.ZeroAddress)
      expect(await veBetterPassport.getDelegator(otherAccount.address)).to.equal(ethers.ZeroAddress)
    })

    it("Should not be able to revoke delegation if not delegator nor delegatee", async function () {
      const { veBetterPassport, owner, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await delegateWithSignature(veBetterPassport, owner, otherAccount, 3600)

      await expect(veBetterPassport.connect(otherAccounts[0]).revokeDelegation()).to.be.reverted
      expect(await veBetterPassport.getDelegatee(owner.address)).to.equal(otherAccount.address)
      expect(await veBetterPassport.getDelegator(otherAccount.address)).to.equal(owner.address)
    })
  })

  describe("ProofOfParticipation", function () {
    it("Should be able to register participation of user with ACTION_REGISTRAR_ROLE", async function () {
      const { x2EarnApps, otherAccounts, owner, veBetterPassport, otherAccount, xAllocationVoting } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions()

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1) // APP_SECURITY.LOW

      await veBetterPassport.connect(owner).registerAction(otherAccount, app1Id)

      expect(await veBetterPassport.userRoundScore(otherAccount, await xAllocationVoting.currentRoundId())).to.equal(
        100,
      )
    })

    it("Should correctly calculate cumulative score", async function () {
      const { x2EarnApps, otherAccounts, owner, veBetterPassport, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1) // APP_SECURITY.LOW

      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 1)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 2)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 3)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 4)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 5)

      expect(await veBetterPassport.userRoundScore(otherAccount, 1)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 2)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 3)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 4)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 5)).to.equal(100)

      /*
        All 5 rounds the user has 100 score.

        round N = [round N score] + ([cumulative score] * [1 - decay factor])

        round 1 = 100 + (0 * 0.8) = 100
        round 2 = 100 + (100 * 0.8) = 180
        round 3 = 100 + (180 * 0.8) = 244
        round 4 = 100 + (244 * 0.8) = 295,2 => 295 
        round 5 = 100 + (295 * 0.8) = 336
      */
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 5)).to.equal(336)
    })

    it("Should correctly transfer enities cumulative score", async function () {
      const { x2EarnApps, otherAccounts, owner, veBetterPassport, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1) // APP_SECURITY.LOW

      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 1)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 2)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 3)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 4)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 5)

      expect(await veBetterPassport.userRoundScore(otherAccount, 1)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 2)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 3)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 4)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 5)).to.equal(100)

      /*
        All 5 rounds the user has 100 score.

        round N = [round N score] + ([cumulative score] * [1 - decay factor])

        round 1 = 100 + (0 * 0.8) = 100
        round 2 = 100 + (100 * 0.8) = 180
        round 3 = 100 + (180 * 0.8) = 244
        round 4 = 100 + (244 * 0.8) = 295,2 => 295 
        round 5 = 100 + (295 * 0.8) = 336
      */
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 5)).to.equal(336)
    })

    it("Should be able to change security multiplier with ACTION_SCORE_MANAGER_ROLE", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      // Sets APP_SECURITY.LOW multiplier to 1000
      await veBetterPassport.connect(owner).setSecurityMultiplier(1, 1000)

      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1) // APP_SECURITY.LOW

      expect(await veBetterPassport.securityMultiplier(1)).to.equal(1000)

      await veBetterPassport.registerActionForRound(otherAccount, app1Id, 1)

      expect(await veBetterPassport.userRoundScore(otherAccount, 1)).to.equal(1000)
      expect(await veBetterPassport.userRoundScoreApp(otherAccount, 1, app1Id)).to.equal(1000)
    })

    it("Should be able to change app's security multiplier with ACTION_SCORE_MANAGER_ROLE", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      // Sets app's security to APP_SECURITY.MEDIUM
      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 2)

      expect(await veBetterPassport.appSecurity(app1Id)).to.equal(2)

      await veBetterPassport.registerActionForRound(otherAccount, app1Id, 1)

      expect(await veBetterPassport.userRoundScore(otherAccount, 1)).to.equal(200)
      expect(await veBetterPassport.userRoundScoreApp(otherAccount, 1, app1Id)).to.equal(200)
    })

    it("Should calculate cumulative score correctly with different security multipliers", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[3].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[4].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, otherAccounts[4].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      // Sets app1 security to APP_SECURITY.LOW
      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1)

      // Sets app2 security to APP_SECURITY.MEDIUM
      await veBetterPassport.connect(owner).setAppSecurity(app2Id, 2)

      // Sets app3 security to APP_SECURITY.HIGH
      await veBetterPassport.connect(owner).setAppSecurity(app3Id, 3)

      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 1)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 2)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app2Id, 3)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app2Id, 4)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app3Id, 5)

      expect(await veBetterPassport.userRoundScore(otherAccount, 1)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 2)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 3)).to.equal(200)
      expect(await veBetterPassport.userRoundScore(otherAccount, 4)).to.equal(200)
      expect(await veBetterPassport.userRoundScore(otherAccount, 5)).to.equal(400)

      /*
        Round 1 score: 100
        Round 2 score: 100
        Round 3 score: 200
        Round 4 score: 200
        Round 5 score: 400

        round N = [round N score] + ([cumulative score] * [1 - decay factor])

        round 1 = 100 + (0 * 0.8) = 100
        round 2 = 100 + (100 * 0.8) = 180
        round 3 = 200 + (180 * 0.8) = 344
        round 4 = 200 + (344 * 0.8) = 475,2 => 475 
        round 5 = 400 + (475 * 0.8) = 780
      */
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 5)).to.equal(780)
    })

    it("Should calculate decay from first round if last round specified is greater than cumulative rounds to look for", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      // Sets app1 security to APP_SECURITY.LOW
      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1)

      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 1)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 2)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 3)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 4)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 5)

      // Get cumulative score from lastRound = 2. first round to start iterations would be negative so we expect cumulative score to start from round 1:
      // round 1 = 100 => round 2 = 100 + (100 * 0.8) = 180
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 2)).to.equal(180)
    })

    it("Should not be able to register action without ACTION_REGISTRAR_ROLE", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await expect(veBetterPassport.connect(otherAccounts[3]).registerAction(otherAccount, app1Id)).to.be.reverted
    })

    it("Should be able to change app's security multiplier with ACTION_SCORE_MANAGER_ROLE", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      // Sets app's security to APP_SECURITY.MEDIUM
      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 2)

      expect(await veBetterPassport.appSecurity(app1Id)).to.equal(2)

      await veBetterPassport.registerActionForRound(otherAccount, app1Id, 1)

      expect(await veBetterPassport.userRoundScore(otherAccount, 1)).to.equal(200)
      expect(await veBetterPassport.userRoundScoreApp(otherAccount, 1, app1Id)).to.equal(200)
    })

    it("Should calculate cumulative score correctly with different security multipliers", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[3].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[4].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, otherAccounts[4].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      // Sets app1 security to APP_SECURITY.LOW
      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1)

      // Sets app2 security to APP_SECURITY.MEDIUM
      await veBetterPassport.connect(owner).setAppSecurity(app2Id, 2)

      // Sets app3 security to APP_SECURITY.HIGH
      await veBetterPassport.connect(owner).setAppSecurity(app3Id, 3)

      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 1)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 2)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app2Id, 3)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app2Id, 4)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app3Id, 5)

      expect(await veBetterPassport.userRoundScore(otherAccount, 1)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 2)).to.equal(100)
      expect(await veBetterPassport.userRoundScore(otherAccount, 3)).to.equal(200)
      expect(await veBetterPassport.userRoundScore(otherAccount, 4)).to.equal(200)
      expect(await veBetterPassport.userRoundScore(otherAccount, 5)).to.equal(400)

      /*
        Round 1 score: 100
        Round 2 score: 100
        Round 3 score: 200
        Round 4 score: 200
        Round 5 score: 400
        round N = [round N score] + ([cumulative score] * [1 - decay factor])
        round 1 = 100 + (0 * 0.8) = 100
        round 2 = 100 + (100 * 0.8) = 180
        round 3 = 200 + (180 * 0.8) = 344
        round 4 = 200 + (344 * 0.8) = 475,2 => 475 
        round 5 = 400 + (475 * 0.8) = 780
      */
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 5)).to.equal(780)
    })

    it("Should calculate decay from first round if last round specified is greater than cumulative rounds to look for", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      await veBetterPassport.setAppSecurity(app1Id, 1) // APP_SECURITY.LOW

      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 1)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 2)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 3)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 4)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 5)

      // Get cumulative score from lastRound = 2. first round to start iterations would be negative so we expect cumulative score to start from round 1:
      // round 1 = 100 => round 2 = 100 + (100 * 0.8) = 180
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 2)).to.equal(180)
    })

    it("Should not be able to register action without ACTION_REGISTRAR_ROLE", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccount, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await expect(veBetterPassport.connect(otherAccount).registerAction(otherAccount, app1Id)).to.be.reverted
    })

    it("Should be able to change app security with ACTION_SCORE_MANAGER_ROLE", async function () {
      const { veBetterPassport, owner, x2EarnApps, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true

      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 2)

      expect(await veBetterPassport.appSecurity(app1Id)).to.equal(2)
    })

    it("Should be able to change decay rate with DEFAULT_ADMIN_ROLE", async function () {
      const { veBetterPassport, owner, otherAccounts, otherAccount, x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await veBetterPassport.grantRole(await veBetterPassport.DEFAULT_ADMIN_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true

      // 90% decay rate
      await veBetterPassport.connect(owner).setDecayRate(90)

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1) // APP_SECURITY.LOW

      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 1)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 2)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 3)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 4)
      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 5)

      /*  
        round 1 = 100
        round 2 = 100 + (100 * 0.1) = 110
        round 3 = 100 + (110 * 0.1) = 111
        round 4 = 100 + (111 * 0.1) = 111.1 => 111
        round 5 = 100 + (111 * 0.1) = 111.1 => 111
      */
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 5)).to.equal(111)
    })

    it("Should not register action score if app security is not set", async function () {
      const { veBetterPassport, owner, otherAccounts, otherAccount, x2EarnApps } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner)
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_SCORE_MANAGER_ROLE(), owner.address)).to.be
        .true
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      await veBetterPassport.connect(owner).registerActionForRound(otherAccount, app1Id, 1)

      expect(await veBetterPassport.userRoundScore(otherAccount, 1)).to.equal(0)
      expect(await veBetterPassport.userRoundScoreApp(otherAccount, 1, app1Id)).to.equal(0)
    })
  })

  describe("Whitelisting & Blacklisting", function () {
    it("WHITELISTER_ROLE should be able to whitelist and blacklist users", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await veBetterPassport.hasRole(await veBetterPassport.WHITELISTER_ROLE(), owner.address)).to.be.true

      await veBetterPassport.toggleCheck(1)
      await veBetterPassport.toggleCheck(2)

      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true
      expect(await veBetterPassport.isCheckEnabled(2)).to.be.true

      await veBetterPassport.connect(owner).whitelist(otherAccount.address)

      expect(await veBetterPassport.isWhitelisted(otherAccount.address)).to.be.true
      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([true, "User is whitelisted"])

      await veBetterPassport.connect(owner).blacklist(otherAccount.address)

      expect(await veBetterPassport.isWhitelisted(otherAccount.address)).to.be.false
      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([false, "User is blacklisted"])
    })

    it("If whitelisted, blacklisting removes from whitelist", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await veBetterPassport.connect(owner).whitelist(otherAccount.address)

      await veBetterPassport.toggleCheck(1)
      await veBetterPassport.toggleCheck(2)

      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true
      expect(await veBetterPassport.isCheckEnabled(2)).to.be.true

      expect(await veBetterPassport.isWhitelisted(otherAccount.address)).to.be.true
      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([true, "User is whitelisted"])

      await veBetterPassport.connect(owner).blacklist(otherAccount.address)

      expect(await veBetterPassport.isWhitelisted(otherAccount.address)).to.be.false
      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([false, "User is blacklisted"])
    })

    it("If blacklisted, whitelisting removes from blacklist", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await veBetterPassport.toggleCheck(1)
      await veBetterPassport.toggleCheck(2)

      expect(await veBetterPassport.isCheckEnabled(1)).to.be.true
      expect(await veBetterPassport.isCheckEnabled(2)).to.be.true

      await veBetterPassport.connect(owner).blacklist(otherAccount.address)

      expect(await veBetterPassport.isWhitelisted(otherAccount.address)).to.be.false
      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([false, "User is blacklisted"])

      await veBetterPassport.connect(owner).whitelist(otherAccount.address)

      expect(await veBetterPassport.isWhitelisted(otherAccount.address)).to.be.true
      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([true, "User is whitelisted"])
    })

    it("Without WHITELISTER_ROLE, should not be able to whitelist or blacklist users", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await expect(veBetterPassport.connect(otherAccount).whitelist(owner.address)).to.be.reverted
      await expect(veBetterPassport.connect(otherAccount).blacklist(owner.address)).to.be.reverted
    })
  })

  describe("isPerson", function () {
    it("Should return true if user is whitelisted", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await veBetterPassport.connect(owner).toggleCheck(1)

      await veBetterPassport.connect(owner).whitelist(otherAccount.address)

      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([true, "User is whitelisted"])
    })

    it("Should return false if user is blacklisted", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await veBetterPassport.connect(owner).toggleCheck(2)

      await veBetterPassport.connect(owner).blacklist(otherAccount.address)

      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([false, "User is blacklisted"])
    })

    it("Should return true if user does meet participation score threshold", async function () {
      const config = createLocalConfig()
      const { veBetterPassport, owner, otherAccount, x2EarnApps, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
        config: {
          ...config,
          VEPASSPORT_PARTICIPATION_SCORE_THRESHOLD: 100, // 100 score threshold
        },
      })

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")

      // Bootstrap emissions
      await bootstrapAndStartEmissions()

      await veBetterPassport.toggleCheck(4)

      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)

      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1) // APP_SECURITY.LOW

      await veBetterPassport.connect(owner).registerAction(otherAccount, app1Id)

      expect(await veBetterPassport.userRoundScore(otherAccount, 1)).to.equal(100)

      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 1)).to.equal(100)

      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([
        true,
        "User's participation score is above the threshold",
      ])
    })

    it("Should return true if user owns an x node", async function () {
      const { veBetterPassport, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await veBetterPassport.connect(owner).toggleCheck(5)

      // Mock node ownership and delegation
      await createNodeHolder(2, otherAccount)

      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([
        true,
        "User owns an economic or xnode",
      ])
    })

    it("Should return false if user doesn't meet any valid personhood criteria", async function () {
      const { veBetterPassport, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await veBetterPassport.isPerson(otherAccount.address)).to.deep.equal([
        false,
        "User does not meet the criteria to be considered a person",
      ])
    })
  })

  describe("Governance & X Allocation Voting", function () {
    it("Should register participation correctly through emission's cycles", async function () {
      const config = createLocalConfig()
      const {
        x2EarnApps,
        owner,
        otherAccount,
        veBetterPassport,
        otherAccounts,
        b3tr,
        B3trContract,
        xAllocationVoting,
        governor,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
        config: {
          ...config,
          VEPASSPORT_PARTICIPATION_SCORE_THRESHOLD: 0, // Initially threshold score of participation is 0, any user can vote
        },
      })

      await getVot3Tokens(otherAccount, "10000")
      await getVot3Tokens(owner, "10000")

      //Add apps
      const app1Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[2].address))
      const app2Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[3].address))
      const app3Id = ethers.keccak256(ethers.toUtf8Bytes(otherAccounts[4].address))
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[2].address, otherAccounts[2].address, otherAccounts[2].address, "metadataURI")
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[3].address, otherAccounts[3].address, otherAccounts[3].address, "metadataURI")
      await x2EarnApps
        .connect(owner)
        .addApp(otherAccounts[4].address, otherAccounts[4].address, otherAccounts[4].address, "metadataURI")

      // Set app security levels
      await veBetterPassport.connect(owner).setAppSecurity(app1Id, 1)
      await veBetterPassport.connect(owner).setAppSecurity(app2Id, 2)
      await veBetterPassport.connect(owner).setAppSecurity(app3Id, 3)

      // Grant action registrar role
      await veBetterPassport.grantRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner)
      expect(await veBetterPassport.hasRole(await veBetterPassport.ACTION_REGISTRAR_ROLE(), owner.address)).to.be.true

      // Bootstrap emissions
      await bootstrapAndStartEmissions()

      // Create a proposal for next round
      // create a new proposal active from round 2
      const tx = await createProposal(b3tr, B3trContract, owner, "Get b3tr token details", "tokenDetails", [], 2)

      const proposalId = await getProposalIdFromTx(tx)

      // pay deposit
      await payDeposit(proposalId.toString(), owner)

      // First round, participation score check is disabled

      // Register actions for round 1
      await veBetterPassport.connect(owner).registerAction(otherAccount, app1Id)
      await veBetterPassport.connect(owner).registerAction(otherAccount, app2Id)

      // User's cumulative score = 100 (app1) + 200 (app2) = 300
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 1)).to.equal(300)

      await veBetterPassport.toggleCheck(4)

      // Vote
      // Note that `otherAccount` can vote because the participation score threshold is set to 0
      await xAllocationVoting
        .connect(otherAccount)
        .castVote(
          1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )

      await waitForProposalToBeActive(proposalId)

      expect(await xAllocationVoting.currentRoundId()).to.equal(2)

      // Set minimum participation score to 500
      await veBetterPassport.setThreshold(500)

      // User tries to vote both governance and x allocation voting but reverts due to not meeting the participation score threshold
      await expect(
        xAllocationVoting
          .connect(otherAccount)
          .castVote(
            2,
            [app1Id, app2Id, app3Id],
            [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
          ),
      ).to.be.revertedWithCustomError(xAllocationVoting, "GovernorPersonhoodVerificationFailed")

      await expect(governor.connect(otherAccount).castVote(proposalId, 2)).to.be.revertedWithCustomError(
        xAllocationVoting,
        "GovernorPersonhoodVerificationFailed",
      )

      // Register actions for round 2
      await veBetterPassport.connect(owner).registerAction(otherAccount, app2Id)
      await veBetterPassport.connect(owner).registerAction(otherAccount, app3Id)

      /*
        User's cumulative score:
        round 1 = 300
        round 2 = 600 + (300 * 0.8) = 840
      */
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 2)).to.equal(840)

      // User now meets the participation score threshold and can vote
      await xAllocationVoting
        .connect(otherAccount)
        .castVote(
          2,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )

      await governor.connect(otherAccount).castVote(proposalId, 2)

      await waitForNextCycle()

      await startNewAllocationRound()

      expect(await xAllocationVoting.currentRoundId()).to.equal(3)

      // Increase participation score threshold to 1000
      await veBetterPassport.setThreshold(1000)

      // User tries to vote x allocation voting but reverts due to not meeting the participation score threshold
      await expect(
        xAllocationVoting
          .connect(otherAccount)
          .castVote(
            3,
            [app1Id, app2Id, app3Id],
            [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
          ),
      ).to.be.revertedWithCustomError(xAllocationVoting, "GovernorPersonhoodVerificationFailed")

      // Register action for round 3
      await veBetterPassport.connect(owner).registerAction(otherAccount, app1Id)

      /*
        User's cumulative score:
        round 1 = 300
        round 2 = 600 + (300 * 0.8) = 840
        round 3 = 100 + (840 * 0.8) = 772
        */
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 3)).to.equal(772)

      // User still doesn't meet the participation score threshold and can't vote
      await expect(
        xAllocationVoting
          .connect(otherAccount)
          .castVote(
            3,
            [app1Id, app2Id, app3Id],
            [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
          ),
      ).to.be.revertedWithCustomError(xAllocationVoting, "GovernorPersonhoodVerificationFailed")

      // register more actions for round 3
      await veBetterPassport.connect(owner).registerAction(otherAccount, app2Id)
      await veBetterPassport.connect(owner).registerAction(otherAccount, app3Id)

      /*
        User's cumulative score:
        round 1 = 300
        round 2 = 600 + (300 * 0.8) = 840
        round 3 = 700 + (840 * 0.8) = 1072
        */
      expect(await veBetterPassport.getCumulativeScoreWithDecay(otherAccount, 3)).to.equal(1372)

      // User now meets the participation score threshold and can vote
      await xAllocationVoting
        .connect(otherAccount)
        .castVote(
          3,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )

      // Delegate passport to owner and try to vote
      await linkEntityToPassportWithSignature(veBetterPassport, otherAccount, owner, 3600)

      expect(await veBetterPassport.isPassport(owner.address)).to.be.true

      // Owner can't vote yet because the delegation is checkpointed and is active from the next round
      await expect(
        xAllocationVoting
          .connect(owner)
          .castVote(
            3,
            [app1Id, app2Id, app3Id],
            [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
          ),
      ).to.be.revertedWithCustomError(xAllocationVoting, "GovernorPersonhoodVerificationFailed")
      await waitForNextCycle()

      await startNewAllocationRound()

      expect(await xAllocationVoting.currentRoundId()).to.equal(4)

      // Owner can vote now
      await xAllocationVoting
        .connect(owner)
        .castVote(
          4,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )
    })
  })
})
