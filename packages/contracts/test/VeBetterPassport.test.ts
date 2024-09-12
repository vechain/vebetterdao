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
})
