import { describe, it } from "mocha"
import { ZERO_ADDRESS, catchRevert, getOrDeployContractInstances } from "./helpers"
import { expect } from "chai"
import { ethers } from "ethers"

describe("B3TRBadge", () => {
  describe("Contract parameters", () => {
    it("Should have correct parameters set on deployment", async () => {
      const { b3trBadge, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await b3trBadge.name()).to.equal("B3TRBadge")
      expect(await b3trBadge.symbol()).to.equal("B3TR")
      expect(await b3trBadge.hasRole(ethers.ZeroHash, await owner.getAddress())).to.equal(true) // 0x00 is the DEFAULT_ADMIN_ROLE of the AccessControl contract. We are checking if the owner has this role
      expect(await b3trBadge.MAX_LEVEL()).to.equal(1)
    })
  })

  describe("Minting", () => {
    it("Should mint a level 1 badge", async () => {
      const { b3trBadge, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      const tx = await b3trBadge.connect(otherAccount).freeMint()

      const receipt = await tx.wait()

      const events = receipt?.logs
      expect(events?.length).to.equal(1)

      const decodedEvent = b3trBadge.interface.parseLog({
        topics: events?.[0].topics as string[],
        data: events?.[0].data as string,
      })

      expect(decodedEvent?.name).to.equal("Transfer")
      expect(decodedEvent?.args?.[0]).to.equal(ZERO_ADDRESS)
      expect(decodedEvent?.args?.[1]).to.equal(await otherAccount.getAddress())

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.totalSupply()).to.equal(1) // Total supply is 1
      expect(await b3trBadge.levelOf(0)).to.equal(1) // Level 1
      expect(await b3trBadge.tokenByIndex(0)).to.equal(0) // Token ID of the first badge is 0
      expect(await b3trBadge.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(0) // Token ID of the first badge owned by otherAccount is 0
    })

    it("Should not be able to mint a badge when already holding one", async () => {
      const { b3trBadge, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await b3trBadge.connect(otherAccount).freeMint()

      await catchRevert(b3trBadge.connect(otherAccount).freeMint())
    })

    it("Should handle multiple mints correctly", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await b3trBadge.connect(otherAccount).freeMint()

      await b3trBadge.connect(owner).freeMint()

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 badge

      expect(await b3trBadge.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.ownerOf(1)).to.equal(await owner.getAddress()) // Owner of the second badge is the owner

      expect(await b3trBadge.totalSupply()).to.equal(2) // Total supply is 2

      expect(await b3trBadge.levelOf(0)).to.equal(1) // Level 1
      expect(await b3trBadge.levelOf(1)).to.equal(1) // Level 1

      expect(await b3trBadge.tokenByIndex(0)).to.equal(0) // Token ID of the first badge is 0
      expect(await b3trBadge.tokenByIndex(1)).to.equal(1) // Token ID of the second badge is 1

      expect(await b3trBadge.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(0) // Token ID of the first badge owned by otherAccount is 0
      expect(await b3trBadge.tokenOfOwnerByIndex(await owner.getAddress(), 0)).to.equal(1) // Token ID of the first badge owned by owner is 1
    })

    it("Should not mint a level higher than 1 if user does not own a X/Economic node NFT", async () => {
      const { b3trBadge, owner, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      await b3trBadge.connect(owner).setMaxLevel(10)

      expect(await b3trBadge.MAX_LEVEL()).to.equal(10)

      await b3trBadge.connect(otherAccount).freeMint()

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge

      expect(await b3trBadge.levelOf(0)).to.equal(1) // Level 1 even though max level is 10
    })

    it("Should not be able to update max mintable levels if not admin", async () => {
      const { b3trBadge, otherAccount } = await getOrDeployContractInstances({ forceDeploy: false })

      await catchRevert(b3trBadge.connect(otherAccount).setMaxMintableLevels(Array(7).fill(1)))
    })

    it("Should not be able to update max mintable levels if not enough levels", async () => {
      const { b3trBadge, owner } = await getOrDeployContractInstances({ forceDeploy: false })

      await catchRevert(b3trBadge.connect(owner).setMaxMintableLevels(Array(6).fill(1))) // 6 levels instead of 7. This is because there are 7 X/Economic node NFTs.
    })

    it("Should be able to update max mintable levels if admin", async () => {
      const { b3trBadge, owner } = await getOrDeployContractInstances({ forceDeploy: false })

      await b3trBadge.connect(owner).setMaxMintableLevels([1, 2, 3, 4, 5, 6, 7])

      // Check if the max mintable levels are set correctly
      expect(await b3trBadge.xNodeTypeToMaxMintableLevel(0)).to.equal(1)
      expect(await b3trBadge.xNodeTypeToMaxMintableLevel(1)).to.equal(2)
      expect(await b3trBadge.xNodeTypeToMaxMintableLevel(2)).to.equal(3)
      expect(await b3trBadge.xNodeTypeToMaxMintableLevel(3)).to.equal(4)
      expect(await b3trBadge.xNodeTypeToMaxMintableLevel(4)).to.equal(5)
      expect(await b3trBadge.xNodeTypeToMaxMintableLevel(5)).to.equal(6)
      expect(await b3trBadge.xNodeTypeToMaxMintableLevel(6)).to.equal(7)
    })
  })

  describe("Transferring", () => {
    it("Should be able to receive a badge from another account", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await b3trBadge.connect(owner).freeMint()

      await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 0)

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 badges

      expect(await b3trBadge.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount

      expect(await b3trBadge.totalSupply()).to.equal(1) // Total supply is 1

      expect(await b3trBadge.levelOf(0)).to.equal(1) // Level 1

      expect(await b3trBadge.tokenByIndex(0)).to.equal(0) // Token ID of the first badge is 0

      expect(await b3trBadge.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(0) // Token ID of the first badge owned by otherAccount is 0
    })

    it("Should not be able to receive a badge from another account if you already have one", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await b3trBadge.connect(otherAccount).freeMint()

      await b3trBadge.connect(owner).freeMint()

      await catchRevert(
        b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1),
      )
    })
  })
})
