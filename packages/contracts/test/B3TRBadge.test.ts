import { describe, it } from "mocha"
import {
  BASE_URI,
  ZERO_ADDRESS,
  bootstrapEmissions,
  catchRevert,
  createProposal,
  getOrDeployContractInstances,
  getProposalIdFromTx,
  getVot3Tokens,
  participateInAllocationVoting,
  waitForProposalToBeActive,
} from "./helpers"
import { expect } from "chai"
import { ethers } from "hardhat"

describe("B3TRBadge", () => {
  describe("Contract parameters", () => {
    it("Should have correct parameters set on deployment", async () => {
      const { b3trBadge, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await b3trBadge.name()).to.equal("B3TRBadge")
      expect(await b3trBadge.symbol()).to.equal("B3TR")
      expect(await b3trBadge.hasRole(await b3trBadge.DEFAULT_ADMIN_ROLE(), await owner.getAddress())).to.equal(true) // 0x00 is the DEFAULT_ADMIN_ROLE of the AccessControl contract. We are checking if the owner has this role
      expect(await b3trBadge.MAX_LEVEL()).to.equal(1)
    })

    it("Admin should be able to set x-allocation voting contract address", async () => {
      const { b3trBadge, owner, xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: true })

      await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      expect(await b3trBadge.xAllocationsGovernor()).to.equal(await xAllocationVoting.getAddress())
    })

    it("Admin should be able to set B3TR Governor contract address", async () => {
      const { b3trBadge, owner, xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: true })

      await b3trBadge.connect(owner).setB3trGovernorAddress(await xAllocationVoting.getAddress())

      expect(await b3trBadge.b3trGovernor()).to.equal(await xAllocationVoting.getAddress())
    })

    it("Only admin should be able to set B3TR Governor contract address", async () => {
      const { b3trBadge, otherAccount, xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: true })

      const initialAddress = await b3trBadge.b3trGovernor()

      await catchRevert(b3trBadge.connect(otherAccount).setB3trGovernorAddress(await xAllocationVoting.getAddress()))

      expect(await b3trBadge.b3trGovernor()).to.equal(initialAddress)
    })

    it("Only admin should be able to set x-allocation voting contract address", async () => {
      const { b3trBadge, otherAccount, xAllocationVoting } = await getOrDeployContractInstances({ forceDeploy: true })

      const initialAddress = await b3trBadge.xAllocationsGovernor()

      await catchRevert(
        b3trBadge.connect(otherAccount).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress()),
      )

      expect(await b3trBadge.xAllocationsGovernor()).to.equal(initialAddress)
    })

    it("Should have base URI set correctly", async () => {
      const { b3trBadge } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await b3trBadge.baseURI()).to.equal(BASE_URI)
    })
  })

  describe("Minting", () => {
    it("Cannot mint if B3TRGovernor address is not set", async () => {
      const { otherAccount, b3tr, xAllocationVoting, owner, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Bootstrap emissions
      await emissions.connect(minterAccount).bootstrap()

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(otherAccount, owner, xAllocationVoting)

      // Deploy NFTBadge
      const NFTBadgeContract = await ethers.getContractFactory("B3TRBadge")
      const b3trBadge = await NFTBadgeContract.deploy("b3trBadge", "BDG", owner, 1, BASE_URI)
      await b3trBadge.waitForDeployment()

      await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await catchRevert(b3trBadge.connect(otherAccount).freeMint())
    })

    it("Cannot mint if XAllocation address is not set", async () => {
      const { otherAccount, xAllocationVoting, b3tr, owner, governor, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Bootstrap emissions
      await emissions.connect(minterAccount).bootstrap()

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(otherAccount, owner, xAllocationVoting)

      // Deploy NFTBadge
      const NFTBadgeContract = await ethers.getContractFactory("B3TRBadge")
      const b3trBadge = await NFTBadgeContract.deploy("b3trBadge", "BDG", owner, 1, BASE_URI)
      await b3trBadge.waitForDeployment()

      await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())

      await catchRevert(b3trBadge.connect(otherAccount).freeMint())
    })

    it("Can know if user participated in governance if XAllocation and B3TRGovernor addresses are set", async () => {
      const { otherAccount, xAllocationVoting, owner, governor, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(otherAccount, owner, xAllocationVoting)

      // Deploy NFTBadge
      const NFTBadgeContract = await ethers.getContractFactory("B3TRBadge")
      const b3trBadge = await NFTBadgeContract.deploy("b3trBadge", "BDG", owner, 1, BASE_URI)
      await b3trBadge.waitForDeployment()

      await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      const participated = await b3trBadge.connect(otherAccount).participatedInGovernance(otherAccount)
      expect(participated).to.equal(true)
    })

    it("User cannot free mint if he did not participate in x-allocation voting or b3tr governance", async () => {
      const { b3trBadge, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Should not be able to free mint
      await catchRevert(b3trBadge.connect(otherAccount).freeMint())
    })

    it("User can free mint if it participated in x-allocation voting", async () => {
      const { b3trBadge, otherAccount, xAllocationVoting, owner, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // Should not be able to free mint
      await catchRevert(b3trBadge.connect(otherAccount).freeMint())

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(otherAccount, owner, xAllocationVoting)

      expect(await b3trBadge.connect(otherAccount).freeMint()).not.to.be.reverted

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.totalSupply()).to.equal(1) // Total supply is 1
    })

    it("User can free mint if he participated in B3TR Governance", async () => {
      const { b3trBadge, otherAccount, b3tr, otherAccounts, governor, B3trContract, owner, minterAccount, emissions } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      const voter = otherAccounts[0]

      // Should not be able to free mint
      await catchRevert(b3trBadge.connect(voter).freeMint())

      // we do it here but will use in the next test
      await getVot3Tokens(voter, "1000")

      // Now we can create a new proposal
      const tx = await createProposal(governor, b3tr, B3trContract, otherAccount, "", "tokenDetails", [])
      const proposalId = await getProposalIdFromTx(tx, governor)
      await waitForProposalToBeActive(proposalId, governor)
      // Now we can vote
      await governor.connect(voter).castVote(proposalId, 1)

      // I should be able to free mint
      await b3trBadge.connect(voter).freeMint()

      expect(await b3trBadge.balanceOf(await voter.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.ownerOf(0)).to.equal(await voter.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.totalSupply()).to.equal(1) // Total supply is 1
    })

    it("User can free mint if he participated both in B3TR Governance and in x-allocation voting", async () => {
      const {
        b3trBadge,
        otherAccount,
        b3tr,
        otherAccounts,
        governor,
        B3trContract,
        owner,
        xAllocationVoting,
        minterAccount,
        emissions,
      } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      const voter = otherAccounts[0]

      // Should not be able to free mint
      await catchRevert(b3trBadge.connect(voter).freeMint())

      // we do it here but will use in the next test
      await getVot3Tokens(voter, "1000")

      // Now we can create a new proposal
      const tx = await createProposal(governor, b3tr, B3trContract, otherAccount, "", "tokenDetails", [])
      const proposalId = await getProposalIdFromTx(tx, governor)
      await waitForProposalToBeActive(proposalId, governor)
      // Now we can vote
      await governor.connect(voter).castVote(proposalId, 1)

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(voter, owner, xAllocationVoting)

      // I should be able to free mint
      await b3trBadge.connect(voter).freeMint()
    })

    it("Should mint a level 1 badge", async () => {
      const { b3trBadge, otherAccount, owner, xAllocationVoting, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, owner, xAllocationVoting)

      const tx = await b3trBadge.connect(otherAccount).freeMint()

      const receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      const events = receipt?.logs

      const decodedEvents = events?.map(event => {
        return b3trBadge.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.length).to.equal(2)

      expect(decodedEvents?.[0]?.name).to.equal("LevelOwnedChanged")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(0)
      expect(decodedEvents?.[0]?.args?.[2]).to.equal(1)

      expect(decodedEvents?.[1]?.name).to.equal("Transfer")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(ZERO_ADDRESS)
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(await otherAccount.getAddress())

      expect(await b3trBadge.numCheckpoints(await otherAccount.getAddress())).to.equal(1) // Other account has 1 checkpoint

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.totalSupply()).to.equal(1) // Total supply is 1

      expect(await b3trBadge.getLevel(otherAccount)).to.equal(1) // Level 1
      expect(await b3trBadge.getPastLevel(await otherAccount.getAddress(), receipt.blockNumber - 1)).to.equal(0) // Level 0 in the past

      expect(await b3trBadge.tokenByIndex(0)).to.equal(0) // Token ID of the first badge is 0
      expect(await b3trBadge.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(0) // Token ID of the first badge owned by otherAccount is 0

      expect(await b3trBadge.tokenURI(0)).to.equal(`${BASE_URI}1`) // Token URI of the first badge is the "base URI/level"
    })

    it("Should not be able to mint a badge when already holding one", async () => {
      const { b3trBadge, otherAccount, owner, xAllocationVoting, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, owner, xAllocationVoting)

      await b3trBadge.connect(otherAccount).freeMint()

      await catchRevert(b3trBadge.connect(otherAccount).freeMint())
    })

    it("Should handle multiple mints correctly", async () => {
      const { b3trBadge, otherAccount, owner, xAllocationVoting, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, owner, xAllocationVoting, true)

      await b3trBadge.connect(otherAccount).freeMint()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, owner, xAllocationVoting, false)

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
      const { b3trBadge, otherAccount, owner, xAllocationVoting, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, owner, xAllocationVoting)

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

    it("Should be able to mint again after transferring a badge", async () => {
      const { b3trBadge, otherAccount, owner, xAllocationVoting, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, owner, xAllocationVoting)

      await b3trBadge.connect(owner).freeMint()

      await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 0)

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

    it("Should return empty string for tokenURI of token that doesn't exist", async () => {
      const { b3trBadge } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await b3trBadge.tokenURI(0)).to.equal("")
    })
  })

  describe("Transferring", () => {
    it("Should be able to receive a badge from another account", async () => {
      const { b3trBadge, otherAccount, owner, xAllocationVoting, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, owner, xAllocationVoting)

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
      const { b3trBadge, otherAccount, owner, xAllocationVoting, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, owner, xAllocationVoting, true)
      await participateInAllocationVoting(owner, owner, xAllocationVoting)

      await b3trBadge.connect(otherAccount).freeMint()

      await b3trBadge.connect(owner).freeMint()

      await catchRevert(
        b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1),
      )
    })

    it("Should track ownership correctly after multiple transfers", async () => {
      const { b3trBadge, otherAccount, owner, otherAccounts, xAllocationVoting, b3tr, emissions, minterAccount } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions(b3tr, emissions, owner, minterAccount)

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, owner, xAllocationVoting, true)

      let tx = await b3trBadge.connect(owner).freeMint()

      let receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      let events = receipt?.logs

      let decodedEvents = events?.map(event => {
        return b3trBadge.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.length).to.equal(2)

      expect(decodedEvents?.[0]?.name).to.equal("LevelOwnedChanged")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(await owner.getAddress())
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(0) // Previous level
      expect(decodedEvents?.[0]?.args?.[2]).to.equal(1) // New level

      tx = await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 0)

      receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      events = receipt?.logs

      decodedEvents = events?.map(event => {
        return b3trBadge.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.length).to.equal(3)

      expect(decodedEvents?.[0]?.name).to.equal("LevelOwnedChanged")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(await owner.getAddress())
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(1) // Previous level
      expect(decodedEvents?.[0]?.args?.[2]).to.equal(0) // New level

      expect(decodedEvents?.[1]?.name).to.equal("LevelOwnedChanged")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(0) // Previous level
      expect(decodedEvents?.[1]?.args?.[2]).to.equal(1) // New level

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 badges

      expect(await b3trBadge.getLevel(await otherAccount.getAddress())).to.equal(1) // Level 1
      expect(await b3trBadge.getLevel(await owner.getAddress())).to.equal(0) // Level 0

      expect(await b3trBadge.getPastLevel(await otherAccount.getAddress(), receipt.blockNumber - 1)).to.equal(0) // Level 0 in the past
      expect(await b3trBadge.getPastLevel(await owner.getAddress(), receipt.blockNumber - 1)).to.equal(1) // Level 1 in the past

      tx = await b3trBadge
        .connect(otherAccount)
        .transferFrom(await otherAccount.getAddress(), await otherAccounts[0].getAddress(), 0)

      receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(0) // Other account has 0 badges
      expect(await b3trBadge.balanceOf(await otherAccounts[0].getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 badges

      expect(await b3trBadge.getLevel(await otherAccount.getAddress())).to.equal(0) // Level 0
      expect(await b3trBadge.getLevel(await otherAccounts[0].getAddress())).to.equal(1) // Level 1
      expect(await b3trBadge.getLevel(await owner.getAddress())).to.equal(0) // Level 0

      expect(await b3trBadge.getPastLevel(await otherAccount.getAddress(), receipt.blockNumber - 1)).to.equal(1) // Level 1 in the past
      expect(await b3trBadge.getPastLevel(await otherAccounts[0].getAddress(), receipt.blockNumber - 1)).to.equal(0) // Level 0 in the past
      expect(await b3trBadge.getPastLevel(await owner.getAddress(), receipt.blockNumber - 1)).to.equal(0) // Level 0 in the past
    })
  })
})
