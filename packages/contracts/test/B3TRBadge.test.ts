import { describe, it } from "mocha"
import {
  ZERO_ADDRESS,
  bootstrapAndStartEmissions,
  bootstrapEmissions,
  catchRevert,
  createProposal,
  getOrDeployContractInstances,
  getProposalIdFromTx,
  getVot3Tokens,
  participateInAllocationVoting,
  upgradeNFTtoLevel,
  waitForCurrentRoundToEnd,
  waitForProposalToBeActive,
} from "./helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { createTestConfig } from "./helpers/config"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"
import { deployProxy } from "../scripts/helpers"
import { B3TRBadge } from "../typechain-types"

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
      const config = createLocalConfig()
      const { b3trBadge } = await getOrDeployContractInstances({ forceDeploy: true, config })

      expect(await b3trBadge.baseURI()).to.equal(config.NFT_BADGE_BASE_URI)
    })

    it("Only admin should be able to pause and unpause the contract", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      await catchRevert(b3trBadge.connect(otherAccount).pause())

      await b3trBadge.connect(owner).pause()

      expect(await b3trBadge.paused()).to.equal(true)

      await b3trBadge.connect(owner).unpause()

      expect(await b3trBadge.paused()).to.equal(false)
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
      expect(await b3trBadge.getMaxMintableLevelOfXNode(0)).to.equal(1)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(1)).to.equal(2)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(2)).to.equal(3)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(3)).to.equal(4)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(4)).to.equal(5)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(5)).to.equal(6)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(6)).to.equal(7)
    })

    it("Should have correct max mintable levels set on deployment", async () => {
      const { b3trBadge } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await b3trBadge.getMaxMintableLevelOfXNode(0)).to.equal(2)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(1)).to.equal(4)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(2)).to.equal(6)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(3)).to.equal(2)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(4)).to.equal(4)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(5)).to.equal(6)
      expect(await b3trBadge.getMaxMintableLevelOfXNode(6)).to.equal(7)
    })

    it("Should not be able to update max mintable levels if not admin", async () => {
      const { b3trBadge, otherAccount } = await getOrDeployContractInstances({ forceDeploy: false })

      await catchRevert(b3trBadge.connect(otherAccount).setMaxMintableLevels(Array(7).fill(1)))
    })

    it("Should have b3tr required to upgrade set on deployment", async () => {
      const { b3trBadge } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await b3trBadge.getB3TRtoUpgradeToLevel(2)).to.equal(10000000000000000000000n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(3)).to.equal(25000000000000000000000n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(4)).to.equal(50000000000000000000000n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(5)).to.equal(100000000000000000000000n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(6)).to.equal(250000000000000000000000n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(7)).to.equal(500000000000000000000000n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(8)).to.equal(2500000000000000000000000n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(9)).to.equal(5000000000000000000000000n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(10)).to.equal(25000000000000000000000000n)
    })

    it("Should be able to update b3tr required to upgrade if admin", async () => {
      const { b3trBadge, owner } = await getOrDeployContractInstances({ forceDeploy: false })

      await b3trBadge
        .connect(owner)
        .setB3TRtoUpgradeToLevel([
          10000000000000000000001n,
          25000000000000000000001n,
          50000000000000000000001n,
          100000000000000000000001n,
          250000000000000000000001n,
          500000000000000000000001n,
          2500000000000000000000001n,
          5000000000000000000000001n,
          25000000000000000000000001n,
        ])

      expect(await b3trBadge.getB3TRtoUpgradeToLevel(2)).to.equal(10000000000000000000001n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(3)).to.equal(25000000000000000000001n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(4)).to.equal(50000000000000000000001n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(5)).to.equal(100000000000000000000001n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(6)).to.equal(250000000000000000000001n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(7)).to.equal(500000000000000000000001n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(8)).to.equal(2500000000000000000000001n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(9)).to.equal(5000000000000000000000001n)
      expect(await b3trBadge.getB3TRtoUpgradeToLevel(10)).to.equal(25000000000000000000000001n)
    })
  })

  describe("Contract upgradeablity", () => {
    it("Admin should be able to upgrade the contract", async function () {
      const { b3trBadge, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("B3TRBadge")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await b3trBadge.getAddress())

      const UPGRADER_ROLE = await b3trBadge.UPGRADER_ROLE()
      expect(await b3trBadge.hasRole(UPGRADER_ROLE, owner.address)).to.eql(true)

      await expect(b3trBadge.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await b3trBadge.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Only admin should be able to upgrade the contract", async function () {
      const { b3trBadge, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("B3TRBadge")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await b3trBadge.getAddress())

      const UPGRADER_ROLE = await b3trBadge.UPGRADER_ROLE()
      expect(await b3trBadge.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(b3trBadge.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await b3trBadge.getAddress())

      expect(newImplAddress.toUpperCase()).to.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.not.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Admin can change UPGRADER_ROLE", async function () {
      const { b3trBadge, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("B3TRBadge")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await b3trBadge.getAddress())

      const UPGRADER_ROLE = await b3trBadge.UPGRADER_ROLE()
      expect(await b3trBadge.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(b3trBadge.connect(owner).grantRole(UPGRADER_ROLE, otherAccount.address)).to.not.be.reverted
      await expect(b3trBadge.connect(owner).revokeRole(UPGRADER_ROLE, owner.address)).to.not.be.reverted

      await expect(b3trBadge.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await b3trBadge.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })
  })

  describe("Minting", () => {
    it("Cannot mint if B3TRGovernor address is not set", async () => {
      const config = createLocalConfig()
      const { otherAccount, b3tr, xAllocationVoting, owner, emissions, minterAccount, treasury } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Bootstrap emissions
      await emissions.connect(minterAccount).bootstrap()

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(otherAccount)

      // Deploy NFTBadge
      const b3trBadge = (await deployProxy("B3TRBadge", [
        "b3trBadge",
        "BDG",
        owner.address,
        owner.address,
        1,
        config.NFT_BADGE_BASE_URI,
        [1, 2, 3, 4, 5, 6, 7],
        [0],
        await b3tr.getAddress(),
        await treasury.getAddress(),
      ])) as B3TRBadge

      await b3trBadge.waitForDeployment()

      await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await catchRevert(b3trBadge.connect(otherAccount).freeMint())
    })

    it("Cannot mint if XAllocation address is not set", async () => {
      const config = createLocalConfig()
      const { otherAccount, b3tr, owner, governor, emissions, minterAccount, treasury } =
        await getOrDeployContractInstances({
          forceDeploy: true,
          config,
        })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Bootstrap emissions
      await emissions.connect(minterAccount).bootstrap()

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(otherAccount)

      // Deploy NFTBadge
      const b3trBadge = (await deployProxy("B3TRBadge", [
        "b3trBadge",
        "BDG",
        owner.address,
        owner.address,
        1,
        config.NFT_BADGE_BASE_URI,
        [1, 2, 3, 4, 5, 6, 7],
        [0],
        await b3tr.getAddress(),
        await treasury.getAddress(),
      ])) as B3TRBadge

      await b3trBadge.waitForDeployment()

      await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())

      await catchRevert(b3trBadge.connect(otherAccount).freeMint())
    })

    it("Can know if user participated in governance if XAllocation and B3TRGovernor addresses are set", async () => {
      const config = createLocalConfig()
      const { otherAccount, xAllocationVoting, owner, governor, b3tr, treasury } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(otherAccount)

      // Deploy NFTBadge
      const b3trBadge = (await deployProxy("B3TRBadge", [
        "b3trBadge",
        "BDG",
        owner.address,
        owner.address,
        1,
        config.NFT_BADGE_BASE_URI,
        [1, 2, 3, 4, 5, 6, 7],
        [0],
        await b3tr.getAddress(),
        await treasury.getAddress(),
      ])) as B3TRBadge

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

    it("User can free mint if participated in x-allocation voting", async () => {
      const { b3trBadge, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // Should not be able to free mint
      await catchRevert(b3trBadge.connect(otherAccount).freeMint())

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(otherAccount)

      await expect(b3trBadge.connect(otherAccount).freeMint()).to.not.be.reverted

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.ownerOf(1)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.totalSupply()).to.equal(1) // Total supply is 1
    })

    it("User can free mint if he participated in B3TR Governance", async () => {
      const { b3trBadge, otherAccount, b3tr, otherAccounts, governor, B3trContract } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapAndStartEmissions()

      const voter = otherAccounts[0]

      // Should not be able to free mint
      await catchRevert(b3trBadge.connect(voter).freeMint())

      // we do it here but will use in the next test
      await getVot3Tokens(voter, "1000")

      // Now we can create a new proposal
      const tx = await createProposal(b3tr, B3trContract, otherAccount, "", "tokenDetails", [])
      const proposalId = await getProposalIdFromTx(tx)
      await waitForProposalToBeActive(proposalId)
      // Now we can vote
      await governor.connect(voter).castVote(proposalId, 1)

      // I should be able to free mint
      await b3trBadge.connect(voter).freeMint()

      expect(await b3trBadge.balanceOf(await voter.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.ownerOf(1)).to.equal(await voter.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.totalSupply()).to.equal(1) // Total supply is 1
      expect(await b3trBadge.getHighestLevel(voter)).to.equal(1) // Level 0
    })

    it("User can free mint if he participated both in B3TR Governance and in x-allocation voting", async () => {
      const { b3trBadge, otherAccount, b3tr, otherAccounts, governor, B3trContract } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapAndStartEmissions()

      const voter = otherAccounts[0]

      // Should not be able to free mint
      await catchRevert(b3trBadge.connect(voter).freeMint())

      // we do it here but will use in the next test
      await getVot3Tokens(voter, "1000")

      // Now we can create a new proposal
      const tx = await createProposal(b3tr, B3trContract, otherAccount, "", "tokenDetails", [])
      const proposalId = await getProposalIdFromTx(tx)
      await waitForProposalToBeActive(proposalId)
      // Now we can vote
      await governor.connect(voter).castVote(proposalId, 1)

      await waitForCurrentRoundToEnd()

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(voter)

      // I should be able to free mint
      await b3trBadge.connect(voter).freeMint()
    })

    it("Should mint a level 1 token", async () => {
      const config = createLocalConfig()
      const { b3trBadge, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount)

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

      expect(decodedEvents?.[0]?.name).to.equal("SelectedLevel")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(0)
      expect(decodedEvents?.[0]?.args?.[2]).to.equal(1)

      expect(decodedEvents?.[1]?.name).to.equal("Transfer")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(ZERO_ADDRESS)
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(await otherAccount.getAddress())

      expect(await b3trBadge.numCheckpoints(await otherAccount.getAddress())).to.equal(1) // Other account has 1 checkpoint

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.ownerOf(1)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.totalSupply()).to.equal(1) // Total supply is 1

      expect(await b3trBadge.getHighestLevel(otherAccount)).to.equal(1) // Level 1
      expect(await b3trBadge.getPastHighestLevel(await otherAccount.getAddress(), receipt.blockNumber - 1)).to.equal(0) // Level 0 in the past

      expect(await b3trBadge.tokenByIndex(0)).to.equal(1) // Token ID of the first badge is 1
      expect(await b3trBadge.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(1) // Token ID of the first badge owned by otherAccount is 1

      expect(await b3trBadge.tokenURI(1)).to.equal(`${config.NFT_BADGE_BASE_URI}1`) // Token URI of the first badge is the "base URI/level"
    })

    it("Should be able to free mint multiple badges", async () => {
      const { b3trBadge, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount)

      await b3trBadge.connect(otherAccount).freeMint()

      await b3trBadge.connect(otherAccount).freeMint()

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(2) // Other account has 2 badges

      expect(await b3trBadge.getHighestLevel(otherAccount)).to.equal(1) // Level 1
    })

    it("Should handle multiple mints from different accounts correctly", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, true)

      await b3trBadge.connect(otherAccount).freeMint()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, false)

      await b3trBadge.connect(owner).freeMint()

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 badge

      expect(await b3trBadge.ownerOf(1)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.ownerOf(2)).to.equal(await owner.getAddress()) // Owner of the second badge is the owner

      expect(await b3trBadge.totalSupply()).to.equal(2) // Total supply is 2

      expect(await b3trBadge.levelOf(1)).to.equal(1) // Level 1
      expect(await b3trBadge.levelOf(2)).to.equal(1) // Level 1

      expect(await b3trBadge.tokenByIndex(0)).to.equal(1) // Token ID of the first badge is 1
      expect(await b3trBadge.tokenByIndex(1)).to.equal(2) // Token ID of the second badge is 2

      expect(await b3trBadge.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(1) // Token ID of the first badge owned by otherAccount is 1
      expect(await b3trBadge.tokenOfOwnerByIndex(await owner.getAddress(), 0)).to.equal(2) // Token ID of the first badge owned by owner is 1

      expect(await b3trBadge.getHighestLevel(otherAccount)).to.equal(1) // Level 1
      expect(await b3trBadge.getHighestLevel(owner)).to.equal(1) // Level 1
    })

    it("Cannot mint if badge is paused", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount)

      await b3trBadge.connect(owner).pause()

      await catchRevert(b3trBadge.connect(otherAccount).freeMint())

      await b3trBadge.connect(owner).unpause()

      await b3trBadge.connect(otherAccount).freeMint()
    })

    it("Should be able to mint again after transferring a badge", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner)

      await b3trBadge.connect(owner).freeMint()

      expect(await b3trBadge.getHighestLevel(owner)).to.equal(1) // Level 1

      await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      expect(await b3trBadge.getHighestLevel(owner)).to.equal(0) // Level 0 (no badge)

      await b3trBadge.connect(owner).freeMint()

      expect(await b3trBadge.getHighestLevel(owner)).to.equal(1) // Level 1

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 badge

      expect(await b3trBadge.ownerOf(1)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount
      expect(await b3trBadge.ownerOf(2)).to.equal(await owner.getAddress()) // Owner of the second badge is the owner

      expect(await b3trBadge.totalSupply()).to.equal(2) // Total supply is 2

      expect(await b3trBadge.levelOf(1)).to.equal(1) // Level 1
      expect(await b3trBadge.levelOf(2)).to.equal(1) // Level 1

      expect(await b3trBadge.tokenByIndex(0)).to.equal(1) // Token ID of the first badge is 1
      expect(await b3trBadge.tokenByIndex(1)).to.equal(2) // Token ID of the second badge is 2

      expect(await b3trBadge.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(1) // Token ID of the first badge owned by otherAccount is 1
      expect(await b3trBadge.tokenOfOwnerByIndex(await owner.getAddress(), 0)).to.equal(2) // Token ID of the first badge owned by owner is 1
    })

    it("Should return empty string for tokenURI of token that doesn't exist", async () => {
      const { b3trBadge } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await b3trBadge.tokenURI(0)).to.equal("")
    })
  })

  describe("Transferring", () => {
    it("Should be able to receive a badge from another account", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner)

      await b3trBadge.connect(owner).freeMint()

      await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 badges

      expect(await b3trBadge.ownerOf(1)).to.equal(await otherAccount.getAddress()) // Owner of the first badge is the otherAccount

      expect(await b3trBadge.totalSupply()).to.equal(1) // Total supply is 1

      expect(await b3trBadge.levelOf(1)).to.equal(1) // Level 1

      expect(await b3trBadge.tokenByIndex(0)).to.equal(1) // Token ID of the first badge is 1

      expect(await b3trBadge.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(1) // Token ID of the first badge owned by otherAccount is 1
    })

    it("Should not be able to transfer a badge if transfers are paused", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner)

      await b3trBadge.connect(owner).freeMint()

      await b3trBadge.connect(owner).pause()

      await catchRevert(
        b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1),
      )

      await b3trBadge.connect(owner).unpause()

      await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)
    })

    it("Should be able to receive a badge from another account if you already have one", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, true)
      await participateInAllocationVoting(owner)

      await b3trBadge.connect(otherAccount).freeMint()

      await b3trBadge.connect(owner).freeMint()

      await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 2)

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(2) // Other account has 2 tokens
    })

    it("Should track ownership correctly after multiple transfers", async () => {
      const { b3trBadge, otherAccount, owner, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, true)

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

      expect(decodedEvents?.[0]?.name).to.equal("SelectedLevel")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(await owner.getAddress())
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(0) // Previous level
      expect(decodedEvents?.[0]?.args?.[2]).to.equal(1) // New level

      tx = await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

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

      expect(decodedEvents?.[0]?.name).to.equal("SelectedLevel")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(await owner.getAddress())
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(1) // Previous level
      expect(decodedEvents?.[0]?.args?.[2]).to.equal(0) // New level

      expect(decodedEvents?.[1]?.name).to.equal("SelectedLevel")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(0) // Previous level
      expect(decodedEvents?.[1]?.args?.[2]).to.equal(1) // New level

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 badges

      expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(1) // Level 1
      expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(0) // Level 0

      expect(await b3trBadge.getPastHighestLevel(await otherAccount.getAddress(), receipt.blockNumber - 1)).to.equal(0) // Level 0 in the past
      expect(await b3trBadge.getPastHighestLevel(await owner.getAddress(), receipt.blockNumber - 1)).to.equal(1) // Level 1 in the past

      tx = await b3trBadge
        .connect(otherAccount)
        .transferFrom(await otherAccount.getAddress(), await otherAccounts[0].getAddress(), 1)

      receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(0) // Other account has 0 badges
      expect(await b3trBadge.balanceOf(await otherAccounts[0].getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 badges

      expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(0) // Level 0
      expect(await b3trBadge.getHighestLevel(await otherAccounts[0].getAddress())).to.equal(1) // Level 1
      expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(0) // Level 0

      expect(await b3trBadge.getPastHighestLevel(await otherAccount.getAddress(), receipt.blockNumber - 1)).to.equal(1) // Level 1 in the past
      expect(
        await b3trBadge.getPastHighestLevel(await otherAccounts[0].getAddress(), receipt.blockNumber - 1),
      ).to.equal(0) // Level 0 in the past
      expect(await b3trBadge.getPastHighestLevel(await owner.getAddress(), receipt.blockNumber - 1)).to.equal(0) // Level 0 in the past
    })
  })

  describe("Level Selection", () => {
    it("Should not select level 0 if I still have a token when transferring out", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, true)

      let tx = await b3trBadge.connect(owner).freeMint()

      let receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(1) // Level 1
      expect(await b3trBadge.getPastHighestLevel(await owner.getAddress(), receipt.blockNumber - 1)).to.equal(0) // Level 0 in the past

      await b3trBadge.connect(owner).freeMint()

      tx = await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 badge
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 badge

      expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(1) // Level 1
      expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(1) // Level 1 (because owner still has a token)

      expect(await b3trBadge.getPastHighestLevel(await otherAccount.getAddress(), receipt?.blockNumber - 1)).to.equal(0) // Level 0 in the past

      await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 2)

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(2) // Other account has 2 badges

      expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(1) // Level 1

      expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(0) // Level 0 (because owner doesn't have any tokens now)
    })

    it("Should select level of token received from another account if I don't have any tokens", async () => {
      const { b3trBadge, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, true)

      let tx = await b3trBadge.connect(otherAccount).freeMint() // Token id 1

      let receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      // Check for Selected and SelectedLevel events
      let events = receipt?.logs

      let decodedEvents = events?.map(event => {
        return b3trBadge.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.[0]?.name).to.equal("SelectedLevel")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(0) // Previous level
      expect(decodedEvents?.[0]?.args?.[2]).to.equal(1) // New level

      tx = await b3trBadge
        .connect(otherAccount)
        .transferFrom(await otherAccount.getAddress(), await owner.getAddress(), 1)

      receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      // Check for Selected and SelectedLevel events
      events = receipt?.logs

      decodedEvents = events?.map(event => {
        return b3trBadge.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.[0]?.name).to.equal("SelectedLevel")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(1) // Previous level
      expect(decodedEvents?.[0]?.args?.[2]).to.equal(0) // New level

      expect(decodedEvents?.[1]?.name).to.equal("SelectedLevel")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await owner.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(0) // Previous level
      expect(decodedEvents?.[1]?.args?.[2]).to.equal(1) // New level

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(0) // Other account has 0 tokens
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 token

      expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(0) // Level 0
      expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(1) // Level 1
    })
  })

  describe("Upgrading", () => {
    it("Should be able to upgrade a level 1 token to a level 2 token", async () => {
      const config = createLocalConfig()
      const { owner, xAllocationVoting, b3tr, minterAccount, governor, treasury } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, true)

      const b3trBadge = (await deployProxy("B3TRBadge", [
        "b3trBadge",
        "BDG",
        owner.address,
        owner.address,
        2,
        config.NFT_BADGE_BASE_URI,
        config.NFT_BADGE_X_NODE_UPGRADEABLE_LEVELS,
        config.NFT_BADGE_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
        await b3tr.getAddress(),
        await treasury.getAddress(),
      ])) as B3TRBadge

      await b3trBadge.waitForDeployment()

      await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await b3trBadge.connect(owner).freeMint() // Token id 1

      await catchRevert(b3trBadge.connect(owner).upgrade(1)) // Insufficient B3TR to upgrade

      await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("10000")) // Get some 10,000 B3TR required to upgrade to level 2

      await b3tr.connect(owner).approve(await b3trBadge.getAddress(), ethers.parseEther("10000")) // We need to approve the B3TRBadge contract to transfer the B3TR required to upgrade from the owner's account

      const balanceOfTreasuryBefore = await b3tr.balanceOf(await treasury.getAddress())

      await b3trBadge.connect(owner).upgrade(1) // Upgrade token id 1 to level 2

      const balanceOfTreasuryAfter = await b3tr.balanceOf(await treasury.getAddress())

      expect(balanceOfTreasuryAfter - balanceOfTreasuryBefore).to.equal(ethers.parseEther("10000")) // 10,000 B3TR should be transferred to the treasury pool

      expect(await b3trBadge.levelOf(1)).to.equal(2) // Level 2

      expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(2) // Level 2
    })

    it("Should be able to transfer a token with level greater than 1", async () => {
      const config = createLocalConfig()
      const { owner, xAllocationVoting, b3tr, minterAccount, governor, otherAccount, treasury } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, true)

      const b3trBadge = (await deployProxy("B3TRBadge", [
        "b3trBadge",
        "BDG",
        owner.address,
        owner.address,
        2,
        config.NFT_BADGE_BASE_URI,
        config.NFT_BADGE_X_NODE_UPGRADEABLE_LEVELS,
        config.NFT_BADGE_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
        await b3tr.getAddress(),
        await treasury.getAddress(),
      ])) as B3TRBadge

      await b3trBadge.waitForDeployment()

      await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await b3trBadge.connect(owner).freeMint() // Token id 1

      await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("10000")) // Get some 10,000 B3TR required to upgrade to level 2

      await b3tr.connect(owner).approve(await b3trBadge.getAddress(), ethers.parseEther("10000")) // We need to approve the B3TRBadge contract to transfer the B3TR required to upgrade from the owner's account

      await b3trBadge.connect(owner).upgrade(1) // Upgrade token id 1 to level 2

      expect(await b3trBadge.levelOf(1)).to.equal(2) // Level 2

      let tx = await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      let receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      let events = receipt?.logs

      let decodedEvents = events?.map(event => {
        return b3trBadge.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.[0]?.name).to.equal("SelectedLevel")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(await owner.getAddress())
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(2) // Previous level
      expect(decodedEvents?.[0]?.args?.[2]).to.equal(0) // New level

      expect(decodedEvents?.[1]?.name).to.equal("SelectedLevel")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(0) // Previous level
      expect(decodedEvents?.[1]?.args?.[2]).to.equal(2) // New level

      expect(await b3trBadge.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 token
      expect(await b3trBadge.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 tokens

      expect(await b3trBadge.levelOf(1)).to.equal(2) // Level 2

      expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(2) // Level 2
      expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(0) // Level 0
    })
  })

  it("Should be able to upgrade to level 10", async () => {
    const config = createTestConfig()
    const { owner, xAllocationVoting, minterAccount, governor, b3tr, otherAccount, treasury } =
      await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

    // Bootstrap emissions
    await bootstrapEmissions()

    // participation in governance is a requirement for minting
    await participateInAllocationVoting(owner, true)

    const b3trBadge = (await deployProxy("B3TRBadge", [
      "b3trBadge",
      "BDG",
      owner.address,
      owner.address,
      10,
      config.NFT_BADGE_BASE_URI,
      config.NFT_BADGE_X_NODE_UPGRADEABLE_LEVELS,
      config.NFT_BADGE_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
      await b3tr.getAddress(),
      await treasury.getAddress(),
    ])) as B3TRBadge

    await b3trBadge.waitForDeployment()

    await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())
    await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

    await b3trBadge.connect(owner).freeMint() // Token id 1

    expect(await b3trBadge.levelOf(1)).to.equal(1) // Level 1
    expect(await b3trBadge.ownerOf(1)).to.equal(await owner.getAddress()) // Owner of the first badge is the owner

    await upgradeNFTtoLevel(1, 10, b3trBadge, b3tr, owner, minterAccount)

    expect(await b3trBadge.levelOf(1)).to.equal(10) // Level 10

    expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(10) // Level 10

    // Transfer the token to another account
    await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

    expect(await b3trBadge.levelOf(1)).to.equal(10) // Level 10
    expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(0) // Level 0

    expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(10) // Level 10
  })

  it("Should not be able to upgrade token not owned", async () => {
    const config = createTestConfig()
    const { owner, xAllocationVoting, minterAccount, governor, b3tr, otherAccount, treasury } =
      await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

    // Bootstrap emissions
    await bootstrapEmissions()

    // participation in governance is a requirement for minting
    await participateInAllocationVoting(owner, true)

    const b3trBadge = (await deployProxy("B3TRBadge", [
      "b3trBadge",
      "BDG",
      owner.address,
      owner.address,
      10,
      config.NFT_BADGE_BASE_URI,
      config.NFT_BADGE_X_NODE_UPGRADEABLE_LEVELS,
      config.NFT_BADGE_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
      await b3tr.getAddress(),
      await treasury.getAddress(),
    ])) as B3TRBadge

    await b3trBadge.waitForDeployment()

    await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())
    await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

    await b3trBadge.connect(owner).freeMint() // Token id 1

    await b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("10000")) // Get some 10,000 B3TR required to upgrade to level 2

    await b3tr.connect(otherAccount).approve(await b3trBadge.getAddress(), ethers.parseEther("10000")) // We need to approve the B3TRBadge contract to transfer the B3TR required to upgrade from the owner's account

    await catchRevert(b3trBadge.connect(otherAccount).upgrade(1)) // Should not be able to upgrade token not owned
  })

  it("Should not be able to upgrade above max level", async () => {
    const config = createTestConfig()
    const { owner, xAllocationVoting, minterAccount, governor, b3tr, treasury } = await getOrDeployContractInstances({
      forceDeploy: true,
      config,
    })

    // Bootstrap emissions
    await bootstrapEmissions()

    // participation in governance is a requirement for minting
    await participateInAllocationVoting(owner, true)

    const b3trBadge = (await deployProxy("B3TRBadge", [
      "b3trBadge",
      "BDG",
      owner.address,
      owner.address,
      10,
      config.NFT_BADGE_BASE_URI,
      config.NFT_BADGE_X_NODE_UPGRADEABLE_LEVELS,
      config.NFT_BADGE_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
      await b3tr.getAddress(),
      await treasury.getAddress(),
    ])) as B3TRBadge

    await b3trBadge.waitForDeployment()

    await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())
    await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

    await b3trBadge.connect(owner).freeMint() // Token id 1

    await upgradeNFTtoLevel(1, 10, b3trBadge, b3tr, owner, minterAccount)

    // Should not be able to upgrade above max level
    await catchRevert(b3trBadge.connect(owner).upgrade(1))
  })

  it("Should correctly track highest level owned", async () => {
    const config = createTestConfig()
    const { owner, xAllocationVoting, minterAccount, governor, b3tr, otherAccount, treasury } =
      await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

    // Bootstrap emissions
    await bootstrapEmissions()

    // participation in governance is a requirement for minting
    await participateInAllocationVoting(owner, true)

    const b3trBadge = (await deployProxy("B3TRBadge", [
      "b3trBadge",
      "BDG",
      owner.address,
      owner.address,
      10,
      config.NFT_BADGE_BASE_URI,
      config.NFT_BADGE_X_NODE_UPGRADEABLE_LEVELS,
      config.NFT_BADGE_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
      await b3tr.getAddress(),
      await treasury.getAddress(),
    ])) as B3TRBadge

    await b3trBadge.waitForDeployment()

    await b3trBadge.connect(owner).setB3trGovernorAddress(await governor.getAddress())
    await b3trBadge.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

    await b3trBadge.connect(owner).freeMint() // Token id 1
    await b3trBadge.connect(owner).freeMint() // Token id 2
    await b3trBadge.connect(owner).freeMint() // Token id 3
    await b3trBadge.connect(owner).freeMint() // Token id 4
    await b3trBadge.connect(owner).freeMint() // Token id 5

    expect(await b3trBadge.levelOf(1)).to.equal(1) // Level 1
    expect(await b3trBadge.ownerOf(1)).to.equal(await owner.getAddress()) // Owner of the first badge is the owner

    /*
      Tokens owned:

      Level 5: 2 tokens
      Level 4: 1 token
      Level 3: 1 token
      Level 1: 1 token
    */
    await upgradeNFTtoLevel(3, 4, b3trBadge, b3tr, owner, minterAccount) // Upgrade token id 3 to level 4
    await upgradeNFTtoLevel(4, 3, b3trBadge, b3tr, owner, minterAccount) // Upgrade token id 4 to level 3
    await upgradeNFTtoLevel(1, 5, b3trBadge, b3tr, owner, minterAccount) // Upgrade token id 1 to level 5
    await upgradeNFTtoLevel(5, 1, b3trBadge, b3tr, owner, minterAccount) // Upgrade token id 5 to level 1
    await upgradeNFTtoLevel(2, 5, b3trBadge, b3tr, owner, minterAccount) // Upgrade token id 2 to level 5

    /*
      Transfer token ID 5 of level 1 to other account

      Tokens owned remaining:
      Level 5: 2
      Level 4: 1
      Level 3: 1
    */
    await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 5)

    expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(5) // Owner has highest level of 5

    expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(1) // Other account now has the highest level of 1

    /*
      Transfer token ID 1 of level 5 to other account

      Tokens owned remaining:
      Level 5: 1
      Level 4: 1
      Level 3: 1
      Level 1: 2
    */
    await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

    expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(5) // Owner still has the highest level of 5

    expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(5) // Other account now has the highest level of 5

    /*
      Transfer token ID 2 of level 5 to other account

      Tokens owned remaining:
      Level 4: 1
      Level 3: 1
      Level 1: 1
    */
    await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 2)

    expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(4) // Owner now has the highest level of 4

    expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(5) // Other account retains the highest level of 5

    /*
      Transfer token ID 3 of level 4 to other account

      Tokens owned remaining:
      Level 3: 1
    */
    await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 3)

    expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(3) // Owner now has the highest level of 3

    expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(5) // Other account retains the highest level of 5

    /*
      Transfer token ID 4 of level 3 to other account

      Tokens owned remaining: None
    */
    await b3trBadge.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 4)

    expect(await b3trBadge.getHighestLevel(await owner.getAddress())).to.equal(0) // Owner now has no tokens so the highest level is 0 (no Level)

    expect(await b3trBadge.getHighestLevel(await otherAccount.getAddress())).to.equal(5) // Other account retains the highest level of 5
  })
})
