import { ethers } from "hardhat"
import { expect } from "chai"
import {
  bootstrapEmissions,
  getOrDeployContractInstances,
  getVot3Tokens,
  startNewAllocationRound,
  waitForRoundToEnd,
} from "./helpers"
import { describe, it } from "mocha"

describe.only("VeBetterPassport - @shard3", function () {
  // deployment
  describe("Deployment", function () {})

  // role management
  describe("Role Management", function () {})

  describe("PersonhoodDelegation", function () {
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
      await veBetterPassport.connect(owner).whitelist(owner.address)
      await veBetterPassport.connect(owner).whitelist(otherAccounts[1].address)

      // Enable whitelist check
      await veBetterPassport.connect(owner).toggleWhitelistCheck()

      // whitelist check should be enabled
      expect(await veBetterPassport.whitelistCheckEnabled()).to.be.true

      // expect owner tp be person
      expect(await veBetterPassport.isPerson(owner.address)).to.be.true

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
        name: "PersonhoodDelegation",
        version: "1",
        chainId: 1337,
        verifyingContract: await veBetterPassport.getAddress(),
      }
      let types = {
        Delegation: [
          { name: "delegator", type: "address" },
          { name: "delegatee", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      }
      // Define a deadline timestamp and nonce
      const nonce = 1
      const deadline = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

      // Prepare the struct to sign
      const delegationData = {
        delegator: owner.address,
        delegatee: delegatee.address,
        nonce: nonce,
        deadline: deadline,
      }

      // Create the EIP-712 signature for the delegator
      const signature = await owner.signTypedData(domain, types, delegationData)

      // Perform the delegation using the signature
      await expect(veBetterPassport.connect(delegatee).delegateWithSignature(owner.address, nonce, deadline, signature))
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
      await xAllocationVoting
        .connect(otherAccounts[1])
        .castVote(
          round1,
          [app1Id, app2Id, app3Id],
          [ethers.parseEther("0"), ethers.parseEther("900"), ethers.parseEther("100")],
        )
    })
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
      await expect(veBetterPassport.connect(otherAccount).toggleWhitelistCheck()).to.be.reverted

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
        forceDeploy: false,
      })
      await expect(veBetterPassport.connect(otherAccount).toggleWhitelistCheck()).to.be.reverted

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleWhitelistCheck())
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Whitelist Check", true)

      // Whitelist check should be enabled
      expect(await veBetterPassport.whitelistCheckEnabled()).to.be.true

      // Cast SETTING_MANAGER_ROLE to otherAccount
      const settingsManagerRole = await veBetterPassport.SETTINGS_MANAGER_ROLE()
      await veBetterPassport.connect(settingsManager).grantRole(settingsManagerRole, otherAccount.address)

      // Other account should be able to toggle the checks
      await expect(veBetterPassport.connect(otherAccount).toggleWhitelistCheck())
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Whitelist Check", false)

      // Whitelist check should be disabled
      expect(await veBetterPassport.whitelistCheckEnabled()).to.be.false
    })

    it("Should be able to toggle whitelist check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: false,
      })

      // Whitelist check should be disabled by default
      expect(await veBetterPassport.whitelistCheckEnabled()).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleWhitelistCheck())
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Whitelist Check", true)

      // Whitelist check should be enabled
      expect(await veBetterPassport.whitelistCheckEnabled()).to.be.true
    })

    it("Should be able to toggle blacklist check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: false,
      })

      // Blacklist check should be disabled by default
      expect(await veBetterPassport.blacklistCheckEnabled()).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleBlacklistCheck())
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Blacklist Check", true)

      // Blacklist check should be enabled
      expect(await veBetterPassport.blacklistCheckEnabled()).to.be.true
    })

    it("Should be able to toggle signaling check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: false,
      })

      // Signaling check should be disabled by default
      expect(await veBetterPassport.signalingCheckEnabled()).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleSignalingCheck())
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Signaling Check", true)

      // Signaling check should be enabled
      expect(await veBetterPassport.signalingCheckEnabled()).to.be.true
    })

    it("Should be able to toggle participation check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: false,
      })

      // Participation check should be disabled by default
      expect(await veBetterPassport.participationScoreCheckEnabled()).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleParticipationScoreCheck())
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Participation Score Check", true)

      // Participation check should be enabled
      expect(await veBetterPassport.participationScoreCheckEnabled()).to.be.true
    })

    it("Should be able to toggle node ownership check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: false,
      })

      // Node ownership check should be disabled by default
      expect(await veBetterPassport.nodeOwnershipCheckEnabled()).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleNodeOwnershipCheck())
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("Node Ownership Check", true)

      // Node ownership check should be enabled
      expect(await veBetterPassport.nodeOwnershipCheckEnabled()).to.be.true
    })

    it("Should be able to toggle gm ownership check", async function () {
      const { owner: settingsManager, veBetterPassport } = await getOrDeployContractInstances({
        forceDeploy: false,
      })

      // Whitelist check should be disabled by default
      expect(await veBetterPassport.gmOwnershipCheckEnabled()).to.be.false

      // Settings manager should be able to toggle the checks
      await expect(veBetterPassport.connect(settingsManager).toggleGMOwnershipCheck())
        .to.emit(veBetterPassport, "CheckToggled")
        .withArgs("GM Ownership Check", true)

      // Whitelist check should be enabled
      expect(await veBetterPassport.gmOwnershipCheckEnabled()).to.be.true
    })
  })
})
