import { describe, it } from "mocha"
import {
  NFT_NAME,
  NFT_SYMBOL,
  ZERO_ADDRESS,
  addNodeToken,
  bootstrapAndStartEmissions,
  bootstrapEmissions,
  catchRevert,
  createProposal,
  getEventName,
  getOrDeployContractInstances,
  getProposalIdFromTx,
  getVot3Tokens,
  participateInAllocationVoting,
  payDeposit,
  upgradeNFTtoLevel,
  waitForCurrentRoundToEnd,
  waitForProposalToBeActive,
} from "./helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import { createLocalConfig } from "@repo/config/contracts/envs/local"
import { createTestConfig } from "./helpers/config"
import { getImplementationAddress } from "@openzeppelin/upgrades-core"
import { deployProxy, upgradeProxy } from "../scripts/helpers"
import { GalaxyMember, GalaxyMemberV2 } from "../typechain-types"
import { time } from "@nomicfoundation/hardhat-network-helpers"

describe("Galaxy Member", () => {
  describe("Contract parameters", () => {
    it("Should have correct parameters set on deployment", async () => {
      const { galaxyMember, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await galaxyMember.name()).to.equal("GalaxyMember")
      expect(await galaxyMember.symbol()).to.equal("GM")
      expect(await galaxyMember.hasRole(await galaxyMember.DEFAULT_ADMIN_ROLE(), await owner.getAddress())).to.equal(
        true,
      )
      expect(await galaxyMember.hasRole(await galaxyMember.PAUSER_ROLE(), await owner.getAddress())).to.equal(true)
      expect(await galaxyMember.MAX_LEVEL()).to.equal(1)
    })

    it("Admin should be able to set x-allocation voting contract address", async () => {
      const { galaxyMember, owner, xAllocationVoting, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await galaxyMember.hasRole(await galaxyMember.CONTRACTS_ADDRESS_MANAGER_ROLE(), owner.address)).to.equal(
        true,
      )
      const tx = await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
      const receipt = await tx.wait()

      const name = getEventName(receipt, galaxyMember)
      expect(name).to.equal("XAllocationsGovernorAddressUpdated")

      expect(await galaxyMember.xAllocationsGovernor()).to.equal(await xAllocationVoting.getAddress())

      expect(
        await galaxyMember.hasRole(await galaxyMember.CONTRACTS_ADDRESS_MANAGER_ROLE(), otherAccount.address),
      ).to.equal(false)
      await expect(galaxyMember.connect(otherAccount).setXAllocationsGovernorAddress(otherAccount.address)).to.be
        .reverted // Only admin should be able to set x-allocation voting contract address

      await expect(galaxyMember.connect(owner).setXAllocationsGovernorAddress(ZERO_ADDRESS)).to.be.reverted // Cannot set x-allocation voting contract address to zero address
    })

    it("Admin should be able to set B3TR Governor contract address", async () => {
      const { galaxyMember, owner, xAllocationVoting, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await galaxyMember.hasRole(await galaxyMember.CONTRACTS_ADDRESS_MANAGER_ROLE(), owner.address)).to.equal(
        true,
      )
      const tx = await galaxyMember.connect(owner).setB3trGovernorAddress(await xAllocationVoting.getAddress())
      const receipt = await tx.wait()

      const name = getEventName(receipt, galaxyMember)
      expect(name).to.equal("B3trGovernorAddressUpdated")

      expect(await galaxyMember.b3trGovernor()).to.equal(await xAllocationVoting.getAddress())

      expect(
        await galaxyMember.hasRole(await galaxyMember.CONTRACTS_ADDRESS_MANAGER_ROLE(), otherAccount.address),
      ).to.equal(false)
      await expect(galaxyMember.connect(otherAccount).setB3trGovernorAddress(await otherAccount.getAddress())).to.be
        .reverted // Only admin should be able to set B3TR Governor contract address

      await expect(galaxyMember.connect(owner).setB3trGovernorAddress(ZERO_ADDRESS)).to.be.reverted
    })

    it("Only admin should be able to set B3TR Governor contract address", async () => {
      const { galaxyMember, otherAccount, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const initialAddress = await galaxyMember.b3trGovernor()

      await catchRevert(galaxyMember.connect(otherAccount).setB3trGovernorAddress(await xAllocationVoting.getAddress()))

      expect(await galaxyMember.b3trGovernor()).to.equal(initialAddress)
    })

    it("Only admin should be able to set x-allocation voting contract address", async () => {
      const { galaxyMember, otherAccount, xAllocationVoting } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const initialAddress = await galaxyMember.xAllocationsGovernor()

      await catchRevert(
        galaxyMember.connect(otherAccount).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress()),
      )

      expect(await galaxyMember.xAllocationsGovernor()).to.equal(initialAddress)
    })

    it("Should have base URI set correctly", async () => {
      const config = createLocalConfig()
      const { galaxyMember, owner } = await getOrDeployContractInstances({ forceDeploy: true, config })

      expect(await galaxyMember.baseURI()).to.equal(config.GM_NFT_BASE_URI)

      const tx = await galaxyMember.connect(owner).setBaseURI("https://newbaseuri.com/")
      const receipt = await tx.wait()

      const name = getEventName(receipt, galaxyMember)
      expect(name).to.equal("BaseURIUpdated")
    })

    it("Only pauser role should be able to pause and unpause the contract", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await galaxyMember.hasRole(await galaxyMember.PAUSER_ROLE(), otherAccount.address)).to.eql(false)
      expect(await galaxyMember.hasRole(await galaxyMember.PAUSER_ROLE(), owner.address)).to.eql(true)

      await catchRevert(galaxyMember.connect(otherAccount).pause())

      await galaxyMember.connect(owner).pause()

      expect(await galaxyMember.paused()).to.equal(true)

      await galaxyMember.connect(owner).unpause()

      expect(await galaxyMember.paused()).to.equal(false)

      await catchRevert(galaxyMember.connect(otherAccount).unpause())
    })

    it("Should have b3tr required to upgrade set on deployment", async () => {
      const { galaxyMember } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await galaxyMember.getB3TRtoUpgradeToLevel(2)).to.equal(10000000000000000000000n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(3)).to.equal(25000000000000000000000n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(4)).to.equal(50000000000000000000000n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(5)).to.equal(100000000000000000000000n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(6)).to.equal(250000000000000000000000n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(7)).to.equal(500000000000000000000000n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(8)).to.equal(2500000000000000000000000n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(9)).to.equal(5000000000000000000000000n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(10)).to.equal(25000000000000000000000000n)
    })

    it("Should be able to update b3tr required to upgrade if admin", async () => {
      const { galaxyMember, owner } = await getOrDeployContractInstances({ forceDeploy: false })

      const tx = await galaxyMember
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
      const receipt = await tx.wait()

      const name = getEventName(receipt, galaxyMember)
      expect(name).to.equal("B3TRtoUpgradeToLevelUpdated")

      expect(await galaxyMember.getB3TRtoUpgradeToLevel(2)).to.equal(10000000000000000000001n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(3)).to.equal(25000000000000000000001n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(4)).to.equal(50000000000000000000001n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(5)).to.equal(100000000000000000000001n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(6)).to.equal(250000000000000000000001n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(7)).to.equal(500000000000000000000001n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(8)).to.equal(2500000000000000000000001n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(9)).to.equal(5000000000000000000000001n)
      expect(await galaxyMember.getB3TRtoUpgradeToLevel(10)).to.equal(25000000000000000000000001n)
    })

    it("Admin should be able to set new base uri", async () => {
      const { galaxyMember, owner, otherAccount } = await getOrDeployContractInstances({ forceDeploy: true })

      const newBaseURI = "https://newbaseuri.com/"

      await galaxyMember.connect(owner).setBaseURI(newBaseURI)

      expect(await galaxyMember.baseURI()).to.equal(newBaseURI)

      await expect(galaxyMember.connect(otherAccount).setBaseURI(newBaseURI + "2")).to.be.reverted

      await expect(galaxyMember.connect(owner).setBaseURI("")).to.be.reverted // base uri cannot be empty
    })

    it("Should have b3tr and treasury addresses set correctly", async () => {
      const { galaxyMember, b3tr, treasury } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await galaxyMember.b3tr()).to.equal(await b3tr.getAddress())
      expect(await galaxyMember.treasury()).to.equal(await treasury.getAddress())
    })

    it("Should support ERC 165 interface", async () => {
      const { galaxyMember } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await galaxyMember.supportsInterface("0x01ffc9a7")).to.equal(true) // ERC165
    })

    it("Should have Vechain Nodes Manager role correctly set", async () => {
      const { galaxyMember, owner } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await galaxyMember.hasRole(await galaxyMember.NODES_MANAGER_ROLE(), owner.address)).to.eql(true)
    })

    it("Should have correct node to free level mapping", async () => {
      const { galaxyMember } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await galaxyMember.getNodeToFreeLevel(0)).to.equal(1) // Level 1 Free Upgrade for None
      expect(await galaxyMember.getNodeToFreeLevel(1)).to.equal(2) // Level 2 Free Upgrade for Strength
      expect(await galaxyMember.getNodeToFreeLevel(2)).to.equal(4) // Level 4 Free Upgrade for Thunder
      expect(await galaxyMember.getNodeToFreeLevel(3)).to.equal(6) // Level 6 Free Upgrade for Mjolnir
      expect(await galaxyMember.getNodeToFreeLevel(4)).to.equal(2) // Level 2 Free Upgrade for VeThorX
      expect(await galaxyMember.getNodeToFreeLevel(5)).to.equal(4) // Level 4 Free Upgrade for StrengthX
      expect(await galaxyMember.getNodeToFreeLevel(6)).to.equal(6) // Level 6 Free Upgrade for ThunderX
      expect(await galaxyMember.getNodeToFreeLevel(7)).to.equal(7) // Level 7 Free Upgrade for MjolnirX
    })
  })

  describe("Contract upgradeablity", () => {
    it("Admin should be able to upgrade the contract", async function () {
      const { galaxyMember, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("GalaxyMember")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await galaxyMember.getAddress())

      const UPGRADER_ROLE = await galaxyMember.UPGRADER_ROLE()
      expect(await galaxyMember.hasRole(UPGRADER_ROLE, owner.address)).to.eql(true)

      await expect(galaxyMember.connect(owner).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await galaxyMember.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Only admin should be able to upgrade the contract", async function () {
      const { galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("GalaxyMember")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await galaxyMember.getAddress())

      const UPGRADER_ROLE = await galaxyMember.UPGRADER_ROLE()
      expect(await galaxyMember.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(galaxyMember.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to.be
        .reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await galaxyMember.getAddress())

      expect(newImplAddress.toUpperCase()).to.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.not.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Admin can change UPGRADER_ROLE", async function () {
      const { galaxyMember, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Deploy the implementation contract
      const Contract = await ethers.getContractFactory("GalaxyMember")
      const implementation = await Contract.deploy()
      await implementation.waitForDeployment()

      const currentImplAddress = await getImplementationAddress(ethers.provider, await galaxyMember.getAddress())

      const UPGRADER_ROLE = await galaxyMember.UPGRADER_ROLE()
      expect(await galaxyMember.hasRole(UPGRADER_ROLE, otherAccount.address)).to.eql(false)

      await expect(galaxyMember.connect(owner).grantRole(UPGRADER_ROLE, otherAccount.address)).to.not.be.reverted
      await expect(galaxyMember.connect(owner).revokeRole(UPGRADER_ROLE, owner.address)).to.not.be.reverted

      await expect(galaxyMember.connect(otherAccount).upgradeToAndCall(await implementation.getAddress(), "0x")).to.not
        .be.reverted

      const newImplAddress = await getImplementationAddress(ethers.provider, await galaxyMember.getAddress())

      expect(newImplAddress.toUpperCase()).to.not.eql(currentImplAddress.toUpperCase())
      expect(newImplAddress.toUpperCase()).to.eql((await implementation.getAddress()).toUpperCase())
    })

    it("Shouldn't be able to initialize the contract if already initialized", async function () {
      const config = createLocalConfig()
      const { galaxyMember, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      await expect(
        galaxyMember.connect(owner).initializeV2(owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL),
      ).to.be.reverted
    })

    it("Should not be able to deploy contract with max level less than 1", async function () {
      const { owner, b3tr, treasury } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const config = createLocalConfig()

      await expect(
        deployProxy("GalaxyMember", [
          {
            name: NFT_NAME,
            symbol: NFT_SYMBOL,
            admin: owner.address,
            upgrader: owner.address,
            pauser: owner.address,
            minter: owner.address,
            contractsAddressManager: owner.address,
            maxLevel: 0,
            baseTokenURI: config.GM_NFT_BASE_URI,
            b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
            b3tr: await b3tr.getAddress(),
            treasury: await treasury.getAddress(),
          },
        ]),
      ).to.be.reverted
    })

    it("Should not be able to increase max level if b3tr required to upgrade is not set", async function () {
      const { owner, b3tr, treasury, minterAccount, otherAccount, xAllocationVoting, governor } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      const config = createLocalConfig()

      await expect(
        deployProxy("GalaxyMember", [
          {
            name: NFT_NAME,
            symbol: NFT_SYMBOL,
            admin: owner.address,
            upgrader: owner.address,
            pauser: owner.address,
            minter: owner.address,
            contractsAddressManager: owner.address,
            maxLevel: 2,
            baseTokenURI: config.GM_NFT_BASE_URI,
            b3trToUpgradeToLevel: [],
            b3tr: await b3tr.getAddress(),
            treasury: await treasury.getAddress(),
          },
        ]),
      ).to.be.reverted

      // Deploy with correct b3tr required to upgrade
      const galaxyMember = (await deployProxy("GalaxyMember", [
        {
          name: NFT_NAME,
          symbol: NFT_SYMBOL,
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 2,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: [10000000000000000000000n],
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())
      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount)

      await galaxyMember.connect(otherAccount).freeMint()

      // Upgrade to level 2
      await upgradeNFTtoLevel(0, 2, galaxyMember, b3tr, otherAccount, minterAccount)

      await expect(upgradeNFTtoLevel(0, 3, galaxyMember, b3tr, otherAccount, minterAccount)).to.be.reverted // Should not be able to upgrade to level 3

      // Set max level to 3
      await expect(galaxyMember.connect(owner).setMaxLevel(3)).to.be.reverted // Should not be able to set max level to 3 as b3tr required to upgrade to level 3 is not set

      await galaxyMember.setB3TRtoUpgradeToLevel([10000000000000000000000n, 25000000000000000000000n]) // Set b3tr required to upgrade to level 3 too

      await galaxyMember.connect(owner).setMaxLevel(3) // Should be able to set max level to 3 now
    })

    it("Should not be able to deploy contract if base uri is empty", async function () {
      const { owner, b3tr, treasury } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const config = createLocalConfig()

      await expect(
        deployProxy("GalaxyMember", [
          {
            name: NFT_NAME,
            symbol: NFT_SYMBOL,
            admin: owner.address,
            upgrader: owner.address,
            pauser: owner.address,
            minter: owner.address,
            contractsAddressManager: owner.address,
            maxLevel: 1,
            baseTokenURI: "",
            b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
            b3tr: await b3tr.getAddress(),
            treasury: await treasury.getAddress(),
          },
        ]),
      ).to.be.reverted
    })

    it("Should not be able to deploy contract if b3tr address is not set", async function () {
      const { owner, treasury } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const config = createLocalConfig()

      await expect(
        deployProxy("GalaxyMember", [
          {
            name: NFT_NAME,
            symbol: NFT_SYMBOL,
            admin: owner.address,
            upgrader: owner.address,
            pauser: owner.address,
            minter: owner.address,
            contractsAddressManager: owner.address,
            maxLevel: 1,
            baseTokenURI: config.GM_NFT_BASE_URI,
            b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
            b3tr: ZERO_ADDRESS,
            treasury: await treasury.getAddress(),
          },
        ]),
      ).to.be.reverted
    })

    it("Should not be able to deploy contract if treasury address is not set", async function () {
      const { owner, b3tr } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      const config = createLocalConfig()

      await expect(
        deployProxy("GalaxyMember", [
          {
            name: NFT_NAME,
            symbol: NFT_SYMBOL,
            admin: owner.address,
            upgrader: owner.address,
            pauser: owner.address,
            minter: owner.address,
            contractsAddressManager: owner.address,
            maxLevel: 1,
            baseTokenURI: config.GM_NFT_BASE_URI,
            b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
            b3tr: await b3tr.getAddress(),
            treasury: ZERO_ADDRESS,
          },
        ]),
      ).to.be.reverted
    })

    it("Should return correct version of the contract", async () => {
      const { galaxyMember } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      expect(await galaxyMember.version()).to.equal("2")
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

      // Deploy Galaxy Member contract
      const galaxyMember = (await deployProxy("GalaxyMember", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 1,
          baseTokenURI: config.GM_NFT_BASE_URI,
          xNodeMaxMintableLevels: [1, 2, 3, 4, 5, 6, 7],
          b3trToUpgradeToLevel: [1000000n],
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await catchRevert(galaxyMember.connect(otherAccount).freeMint())
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

      // Deploy Galaxy Member contract
      const galaxyMember = (await deployProxy("GalaxyMember", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 1,
          baseTokenURI: config.GM_NFT_BASE_URI,
          xNodeMaxMintableLevels: [1, 2, 3, 4, 5, 6, 7],
          b3trToUpgradeToLevel: [1000000n],
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())

      await catchRevert(galaxyMember.connect(otherAccount).freeMint())
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

      // Deploy Galaxy Member contract
      const galaxyMember = (await deployProxy("GalaxyMember", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 1,
          baseTokenURI: config.GM_NFT_BASE_URI,
          xNodeMaxMintableLevels: [1, 2, 3, 4, 5, 6, 7],
          b3trToUpgradeToLevel: [1000000n],
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      const participated = await galaxyMember.connect(otherAccount).participatedInGovernance(otherAccount)
      expect(participated).to.equal(true)
    })

    it("User cannot free mint if he did not participate in x-allocation voting or b3tr governance", async () => {
      const { galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Should not be able to free mint
      await catchRevert(galaxyMember.connect(otherAccount).freeMint())
    })

    it("User can free mint if participated in x-allocation voting", async () => {
      const { galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // Should not be able to free mint
      await catchRevert(galaxyMember.connect(otherAccount).freeMint())

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(otherAccount)

      expect(await galaxyMember.connect(otherAccount).freeMint()).not.to.be.reverted

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 NFT
      expect(await galaxyMember.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first NFT is the otherAccount
      expect(await galaxyMember.totalSupply()).to.equal(1) // Total supply is 1
    })

    it("User can free mint if he participated in B3TR Governance", async () => {
      const { galaxyMember, otherAccount, b3tr, otherAccounts, governor, B3trContract } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapAndStartEmissions()

      const voter = otherAccounts[0]

      // Should not be able to free mint
      await catchRevert(galaxyMember.connect(voter).freeMint())

      // we do it here but will use in the next test
      await getVot3Tokens(voter, "30000")

      // Now we can create a new proposal
      const tx = await createProposal(b3tr, B3trContract, otherAccount, "", "tokenDetails", [])
      const proposalId = await getProposalIdFromTx(tx)
      await payDeposit(proposalId, otherAccount)
      await waitForProposalToBeActive(proposalId)
      // Now we can vote
      await governor.connect(voter).castVote(proposalId, 1)

      // I should be able to free mint
      await galaxyMember.connect(voter).freeMint()

      expect(await galaxyMember.balanceOf(await voter.getAddress())).to.equal(1) // Other account has 1 NFT
      expect(await galaxyMember.ownerOf(0)).to.equal(await voter.getAddress()) // Owner of the first NFT is the otherAccount
      expect(await galaxyMember.totalSupply()).to.equal(1) // Total supply is 1
      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await voter.getAddress()))).to.equal(1) // Level 0
    })

    it("User can free mint if he participated both in B3TR Governance and in x-allocation voting", async () => {
      const { galaxyMember, otherAccount, b3tr, otherAccounts, governor, B3trContract } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Bootstrap emissions
      await bootstrapAndStartEmissions()

      const voter = otherAccounts[0]

      // Should not be able to free mint
      await catchRevert(galaxyMember.connect(voter).freeMint())

      // we do it here but will use in the next test
      await getVot3Tokens(voter, "30000")

      // Now we can create a new proposal
      const tx = await createProposal(b3tr, B3trContract, otherAccount, "", "tokenDetails", [])
      const proposalId = await getProposalIdFromTx(tx)
      await payDeposit(proposalId, otherAccount)

      await waitForProposalToBeActive(proposalId)
      // Now we can vote
      await governor.connect(voter).castVote(proposalId, 1)

      await waitForCurrentRoundToEnd()

      // Should be able to free mint after participating in allocation voting
      await participateInAllocationVoting(voter)

      // I should be able to free mint
      await galaxyMember.connect(voter).freeMint()
    })

    it("Should mint a level 1 token", async () => {
      const config = createLocalConfig()
      const { galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        config,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount)

      const tx = await galaxyMember.connect(otherAccount).freeMint()

      const receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      const events = receipt?.logs

      const decodedEvents = events?.map(event => {
        return galaxyMember.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.length).to.equal(2)

      expect(decodedEvents?.[0]?.name).to.equal("Transfer")
      expect(decodedEvents?.[0]?.args?.[0]).to.equal(ZERO_ADDRESS)
      expect(decodedEvents?.[0]?.args?.[1]).to.equal(await otherAccount.getAddress())

      expect(decodedEvents?.[1]?.name).to.equal("Selected")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(0)

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 NFT
      expect(await galaxyMember.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first NFT is the otherAccount
      expect(await galaxyMember.totalSupply()).to.equal(1) // Total supply is 1

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1
      expect(await galaxyMember.getSelectedTokenId(await otherAccount.getAddress())).to.equal(0) // Selected token ID is 0

      expect(await galaxyMember.tokenByIndex(0)).to.equal(0) // Token ID of the first NFT is 1
      expect(await galaxyMember.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(0) // Token ID of the first NFT owned by otherAccount is 1

      expect(await galaxyMember.tokenURI(0)).to.equal(`${config.GM_NFT_BASE_URI}1.json`) // Token URI of the first NFT is the "base URI/level"
    })

    it("Should be able to free mint multiple NFTs", async () => {
      const { galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount)

      await galaxyMember.connect(otherAccount).freeMint()

      await galaxyMember.connect(otherAccount).freeMint()

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(2) // Other account has 2 NFTs

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(otherAccount))).to.equal(1) // Level 1
    })

    it("Should handle multiple mints from different accounts correctly", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, true)

      await galaxyMember.connect(otherAccount).freeMint()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, false)

      await galaxyMember.connect(owner).freeMint()

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 NFT
      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 NFT

      expect(await galaxyMember.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first NFT is the otherAccount
      expect(await galaxyMember.ownerOf(1)).to.equal(await owner.getAddress()) // Owner of the second NFT is the owner

      expect(await galaxyMember.totalSupply()).to.equal(2) // Total supply is 2

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1
      expect(await galaxyMember.levelOf(1)).to.equal(1) // Level 1

      expect(await galaxyMember.tokenByIndex(0)).to.equal(0) // Token ID of the first NFT is 1
      expect(await galaxyMember.tokenByIndex(1)).to.equal(1) // Token ID of the second NFT is 2

      expect(await galaxyMember.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(0) // Token ID of the first NFT owned by otherAccount is 1
      expect(await galaxyMember.tokenOfOwnerByIndex(await owner.getAddress(), 0)).to.equal(1) // Token ID of the first NFT owned by owner is 1

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(otherAccount))).to.equal(1)
      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(owner))).to.equal(1)
    })

    it("Cannot mint if contract is paused", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount)

      await galaxyMember.connect(owner).pause()

      await catchRevert(galaxyMember.connect(otherAccount).freeMint())

      await galaxyMember.connect(owner).unpause()

      await galaxyMember.connect(otherAccount).freeMint()
    })

    it("Should be able to mint again after transferring a NFT", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(owner))).to.equal(1)

      await galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 0)

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(owner))).to.equal(1) // was expect(await galaxyMember.getHighestLevel(owner)).to.equal(0) // Level 0 (no NFT)

      await galaxyMember.connect(owner).freeMint()

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(owner))).to.equal(1)

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 NFT
      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 NFT

      expect(await galaxyMember.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first NFT is the otherAccount
      expect(await galaxyMember.ownerOf(1)).to.equal(await owner.getAddress()) // Owner of the second NFT is the owner

      expect(await galaxyMember.totalSupply()).to.equal(2) // Total supply is 2

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1
      expect(await galaxyMember.levelOf(1)).to.equal(1) // Level 1

      expect(await galaxyMember.tokenByIndex(0)).to.equal(0) // Token ID of the first NFT is 1
      expect(await galaxyMember.tokenByIndex(1)).to.equal(1) // Token ID of the second NFT is 2

      expect(await galaxyMember.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(0) // Token ID of the first NFT owned by otherAccount is 1
      expect(await galaxyMember.tokenOfOwnerByIndex(await owner.getAddress(), 0)).to.equal(1) // Token ID of the first NFT owned by owner is 1
    })

    it("Should return empty string for tokenURI of token that doesn't exist", async () => {
      const { galaxyMember } = await getOrDeployContractInstances({ forceDeploy: true })

      expect(await galaxyMember.tokenURI(0)).to.equal("")
    })

    it("Should not be able to free mint if public minting is paused", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount)

      const tx = await galaxyMember.connect(owner).setIsPublicMintingPaused(true)
      const receipt = await tx.wait()

      const name = getEventName(receipt, galaxyMember)
      expect(name).to.equal("PublicMintingPaused")

      await expect(galaxyMember.connect(otherAccount).freeMint()).to.be.reverted

      await galaxyMember.connect(owner).setIsPublicMintingPaused(false)

      await galaxyMember.connect(otherAccount).freeMint()
    })
  })

  describe("Transferring", () => {
    it("Should be able to receive a GM NFT from another account", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 0)

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 NFT
      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 NFTs

      expect(await galaxyMember.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first NFT is the otherAccount

      expect(await galaxyMember.totalSupply()).to.equal(1) // Total supply is 1

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1

      expect(await galaxyMember.tokenByIndex(0)).to.equal(0) // Token ID of the first NFT is 1

      expect(await galaxyMember.tokenOfOwnerByIndex(await otherAccount.getAddress(), 0)).to.equal(0) // Token ID of the first NFT owned by otherAccount is 1
    })

    it("Should not be able to transfer a NFT if transfers are paused", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.connect(owner).pause()

      await catchRevert(
        galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 0),
      )

      await galaxyMember.connect(owner).unpause()

      await galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 0)
    })

    it("Should be able to receive a GM NFT from another account if you already have one", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, true)
      await participateInAllocationVoting(owner)

      await galaxyMember.connect(otherAccount).freeMint()

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(2) // Other account has 2 tokens
    })

    it("Should track ownership correctly after multiple transfers", async () => {
      const { galaxyMember, otherAccount, owner, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, true)

      let tx = await galaxyMember.connect(owner).freeMint()

      let receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      let events = receipt?.logs

      let decodedEvents = events?.map(event => {
        return galaxyMember.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.length).to.equal(2)

      expect(decodedEvents?.[1]?.name).to.equal("Selected")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await owner.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(0)

      tx = await galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 0)

      receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      events = receipt?.logs

      decodedEvents = events?.map(event => {
        return galaxyMember.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.length).to.equal(2)

      expect(decodedEvents?.[1]?.name).to.equal("Selected")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(0)

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 NFT
      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 NFTs

      expect(
        await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await otherAccount.getAddress())),
      ).to.equal(1) // Level 1
      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await owner.getAddress()))).to.equal(1) // Level 1

      tx = await galaxyMember
        .connect(otherAccount)
        .transferFrom(await otherAccount.getAddress(), await otherAccounts[0].getAddress(), 0)

      receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(0) // Other account has 0 NFTs
      expect(await galaxyMember.balanceOf(await otherAccounts[0].getAddress())).to.equal(1) // Other account has 1 NFT
      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 NFTs

      expect(
        await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await otherAccount.getAddress())),
      ).to.equal(1) // Level 1
      expect(
        await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await otherAccounts[0].getAddress())),
      ).to.equal(1) // Level 1
      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await owner.getAddress()))).to.equal(1) // Level 1
    })

    it("Should be able to send GM NFT to same account", async () => {
      const { galaxyMember, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await owner.getAddress(), 0)

      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 NFT
      expect(await galaxyMember.ownerOf(0)).to.equal(await owner.getAddress()) // Owner of the first NFT is the owner
      expect(await galaxyMember.totalSupply()).to.equal(1) // Total supply is 1
    })

    it("Should be able to burn a GM NFT owned", async () => {
      const { galaxyMember, owner, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      await galaxyMember.connect(owner).burn(0)

      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 NFTs
      expect(await galaxyMember.totalSupply()).to.equal(1) // Total supply is 0

      await expect(galaxyMember.connect(owner).burn(1)).to.be.reverted // Owner cannot burn a token he doesn't own
    })
  })

  describe("Token Selection", () => {
    it("Should not select level 0 if I still have a token when transferring out", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, true)

      let tx = await galaxyMember.connect(owner).freeMint()

      let receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await owner.getAddress()))).to.equal(1) // Level 1

      await galaxyMember.connect(owner).freeMint()

      tx = await galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 0)

      receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 NFT
      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 NFT

      expect(
        await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await otherAccount.getAddress())),
      ).to.equal(1) // Level 1
      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await owner.getAddress()))).to.equal(1) // Level 1

      await galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(2) // Other account has 2 NFTs

      expect(
        await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await otherAccount.getAddress())),
      ).to.equal(1) // Level 1

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await owner.getAddress()))).to.equal(1) // Level 1
    })

    it("Should select level of token received from another account if I don't have any tokens", async () => {
      const { galaxyMember, otherAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(otherAccount, true)

      let tx = await galaxyMember.connect(otherAccount).freeMint() // Token id 1

      let receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      // Check for Selected and SelectedLevel events
      let events = receipt?.logs

      let decodedEvents = events?.map(event => {
        return galaxyMember.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.[1]?.name).to.equal("Selected")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(0)

      tx = await galaxyMember
        .connect(otherAccount)
        .transferFrom(await otherAccount.getAddress(), await owner.getAddress(), 0)

      receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      // Check for Selected and SelectedLevel events
      events = receipt?.logs

      decodedEvents = events?.map(event => {
        return galaxyMember.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.[1]?.name).to.equal("Selected")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await owner.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(0)

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(0) // Other account has 0 tokens
      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(1) // Owner has 1 token

      expect(
        await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await otherAccount.getAddress())),
      ).to.equal(1) // Level 1
      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await owner.getAddress()))).to.equal(1) // Level 1
    })
  })

  describe("Upgrading", () => {
    it("Should be able to upgrade a level 1 token to a level 2 token", async () => {
      const { owner, b3tr, minterAccount, treasury, otherAccount, galaxyMember } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, true)

      await galaxyMember.connect(owner).setMaxLevel(2)

      await galaxyMember.connect(owner).freeMint() // Token id 0

      await catchRevert(galaxyMember.connect(owner).upgrade(0)) // Insufficient B3TR to upgrade

      await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("10000")) // Get some 10,000 B3TR required to upgrade to level 2

      await b3tr.connect(owner).approve(await galaxyMember.getAddress(), ethers.parseEther("10000")) // We need to approve the galaxyMember contract to transfer the B3TR required to upgrade from the owner's account

      const balanceOfTreasuryBefore = await b3tr.balanceOf(await treasury.getAddress())

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1

      await galaxyMember.connect(owner).upgrade(0) // Upgrade token id 1 to level 2

      const balanceOfTreasuryAfter = await b3tr.balanceOf(await treasury.getAddress())

      expect(balanceOfTreasuryAfter - balanceOfTreasuryBefore).to.equal(ethers.parseEther("10000")) // 10,000 B3TR should be transferred to the treasury pool

      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level 2

      await expect(upgradeNFTtoLevel(0, 3, galaxyMember, b3tr, owner, minterAccount)).to.be.reverted // Level 3 is not available

      await expect(galaxyMember.connect(otherAccount).setMaxLevel(3)).to.be.reverted // Only owner can set max level

      await expect(galaxyMember.connect(owner).setMaxLevel(2)).to.be.reverted // Max level must be greater than current level

      const tx = await galaxyMember.connect(owner).setMaxLevel(3)
      const receipt = await tx.wait()

      const name = getEventName(receipt, galaxyMember)
      expect(name).to.equal("MaxLevelUpdated")

      await b3tr.connect(minterAccount).mint(owner, await galaxyMember.getB3TRtoUpgradeToLevel(3))

      await b3tr.connect(owner).approve(await galaxyMember.getAddress(), await galaxyMember.getB3TRtoUpgradeToLevel(3))

      await galaxyMember.connect(owner).upgrade(0) // Upgrade token id 1 to level 3

      expect(await galaxyMember.levelOf(0)).to.equal(3) // Level 3
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

      const galaxyMemberV1 = (await deployProxy("GalaxyMember", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 2,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMember",
        "GalaxyMemberV2",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMemberV2

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await galaxyMember.connect(owner).freeMint() // Token id 0

      await galaxyMember.connect(owner).burn(0)

      await galaxyMember.connect(owner).freeMint() // Token id 1

      await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("10000")) // Get some 10,000 B3TR required to upgrade to level 2

      await b3tr.connect(owner).approve(await galaxyMember.getAddress(), ethers.parseEther("10000")) // We need to approve the galaxyMember contract to transfer the B3TR required to upgrade from the owner's account

      await galaxyMember.connect(owner).upgrade(1) // Upgrade token id 0 to level 2

      expect(await galaxyMember.levelOf(1)).to.equal(2) // Level 2

      let tx = await galaxyMember
        .connect(owner)
        .transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      let receipt = await tx.wait()

      if (!receipt?.blockNumber) throw new Error("No receipt block number")

      let events = receipt?.logs

      let decodedEvents = events?.map(event => {
        return galaxyMember.interface.parseLog({
          topics: event?.topics as string[],
          data: event?.data as string,
        })
      })

      expect(decodedEvents?.[1]?.name).to.equal("Selected")
      expect(decodedEvents?.[1]?.args?.[0]).to.equal(await otherAccount.getAddress())
      expect(decodedEvents?.[1]?.args?.[1]).to.equal(1) // Previous level

      expect(await galaxyMember.balanceOf(await otherAccount.getAddress())).to.equal(1) // Other account has 1 token
      expect(await galaxyMember.balanceOf(await owner.getAddress())).to.equal(0) // Owner has 0 tokens

      expect(await galaxyMember.levelOf(1)).to.equal(2) // Level 2

      expect(
        await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await otherAccount.getAddress())),
      ).to.equal(2)
      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await owner.getAddress()))).to.equal(1) // Level 1
    })

    it("Should not be able to upgrade if contract is paused", async () => {
      const config = createLocalConfig()
      const { owner, xAllocationVoting, b3tr, minterAccount, governor, treasury } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, true)

      const galaxyMemberV1 = (await deployProxy("GalaxyMember", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 3,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMember",
        "GalaxyMemberV2",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMemberV2

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await galaxyMember.connect(owner).freeMint() // Token id 1

      await upgradeNFTtoLevel(0, 2, galaxyMember, b3tr, owner, minterAccount)

      await galaxyMember.connect(owner).pause()

      await catchRevert(galaxyMember.connect(owner).upgrade(0))

      await galaxyMember.connect(owner).unpause()

      await upgradeNFTtoLevel(0, 3, galaxyMember, b3tr, owner, minterAccount)
    })

    it("Should not be able to upgrade if allowance is not set", async () => {
      const config = createLocalConfig()
      const { owner, xAllocationVoting, b3tr, minterAccount, governor, treasury } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Bootstrap emissions
      await bootstrapEmissions()

      // participation in governance is a requirement for minting
      await participateInAllocationVoting(owner, true)

      const galaxyMemberV1 = (await deployProxy("GalaxyMember", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 2,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMember",
        "GalaxyMemberV2",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMemberV2

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await galaxyMember.connect(owner).freeMint() // Token id 1

      await b3tr.connect(minterAccount).mint(owner, ethers.parseEther("10000")) // Get some 10,000 B3TR required to upgrade to level 2

      await catchRevert(galaxyMember.connect(owner).upgrade(1)) // Allowance not set
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

      const galaxyMemberV1 = (await deployProxy("GalaxyMember", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMember",
        "GalaxyMemberV2",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMemberV2

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await galaxyMember.connect(owner).freeMint() // Token id 0

      await galaxyMember.connect(owner).burn(0)

      await galaxyMember.connect(owner).freeMint() // Token id 1

      expect(await galaxyMember.levelOf(1)).to.equal(1) // Level 1
      expect(await galaxyMember.ownerOf(1)).to.equal(await owner.getAddress()) // Owner of the first NFT is the owner

      await upgradeNFTtoLevel(1, 10, galaxyMember, b3tr, owner, minterAccount)

      expect(await galaxyMember.levelOf(1)).to.equal(10) // Level 10

      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await owner.getAddress()))).to.equal(10)

      // Transfer the token to another account
      await galaxyMember.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      expect(await galaxyMember.levelOf(1)).to.equal(10) // Level 10
      expect(await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await owner.getAddress()))).to.equal(1)

      expect(
        await galaxyMember.levelOf(await galaxyMember.getSelectedTokenId(await otherAccount.getAddress())),
      ).to.equal(10)
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

      const galaxyMemberV1 = (await deployProxy("GalaxyMember", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMember",
        "GalaxyMemberV2",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMemberV2

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await galaxyMember.connect(owner).freeMint() // Token id 0

      await b3tr.connect(minterAccount).mint(otherAccount, ethers.parseEther("10000")) // Get some 10,000 B3TR required to upgrade to level 2

      await b3tr.connect(otherAccount).approve(await galaxyMember.getAddress(), ethers.parseEther("10000")) // We need to approve the galaxyMember contract to transfer the B3TR required to upgrade from the owner's account

      await catchRevert(galaxyMember.connect(otherAccount).upgrade(0)) // Should not be able to upgrade token not owned
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

      const galaxyMemberV1 = (await deployProxy("GalaxyMember", [
        {
          name: "galaxyMember",
          symbol: "GM",
          admin: owner.address,
          upgrader: owner.address,
          pauser: owner.address,
          minter: owner.address,
          contractsAddressManager: owner.address,
          maxLevel: 10,
          baseTokenURI: config.GM_NFT_BASE_URI,
          b3trToUpgradeToLevel: config.GM_NFT_B3TR_REQUIRED_TO_UPGRADE_TO_LEVEL,
          b3tr: await b3tr.getAddress(),
          treasury: await treasury.getAddress(),
        },
      ])) as GalaxyMember

      const galaxyMember = (await upgradeProxy(
        "GalaxyMember",
        "GalaxyMemberV2",
        await galaxyMemberV1.getAddress(),
        [owner.address, owner.address, config.GM_NFT_NODE_TO_FREE_LEVEL],
        { version: 2 },
      )) as unknown as GalaxyMemberV2

      await galaxyMember.waitForDeployment()

      await galaxyMember.connect(owner).setB3trGovernorAddress(await governor.getAddress())
      await galaxyMember.connect(owner).setXAllocationsGovernorAddress(await xAllocationVoting.getAddress())

      await galaxyMember.connect(owner).freeMint() // Token id 0

      await upgradeNFTtoLevel(0, 10, galaxyMember, b3tr, owner, minterAccount)

      // Should not be able to upgrade above max level
      await catchRevert(galaxyMember.connect(owner).upgrade(0))
    })
  })

  describe("Vechain nodes Binding", () => {
    it("Should be able to attach a Strength Vechain Node to a GM NFT", async () => {
      const { owner, vechainNodesMock, galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      const nodeMetadata = await addNodeToken(1, otherAccount) // Mint new Strength Economy Node (Level 1) to other account

      const tokenId = await vechainNodesMock.ownerToId(otherAccount.address)
      expect(await vechainNodesMock.getMetadata(tokenId)).to.deep.equal(nodeMetadata)

      expect(await galaxyMember.getNodeLevelOf(1)).to.equal(1) // The Mock Vechain Node is Strength Economy Node which is Level 1

      await participateInAllocationVoting(otherAccount)

      await galaxyMember.connect(otherAccount).freeMint()

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1
      expect(await galaxyMember.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first NFT is the owner

      expect(await galaxyMember.getNodeToFreeLevel(1)).to.equal(2) // Strength Economy Node attached to GM NFT => Level 2

      // Attach Strength Economy Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).attachNode(1, 0)

      expect(await galaxyMember.getNodeIdAttached(0)).to.equal(1) // Strength Economy Node (token ID 1) attached to GM NFT (token ID 0)

      expect(await galaxyMember.MAX_LEVEL()).to.equal(1) // GM NFT MAX_LEVEL is 1

      // Strength Economy Node should be attached to GM NFT => Level 2
      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1 because MAX_LEVEL is 1

      // Update GM MAX_LEVEL to 5
      await galaxyMember.connect(owner).setMaxLevel(5)

      // Now GM NFT Level should be the highest possible for Strength Economy Node => Level 2
      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level 2
    })

    it("Should track all Vechain Nodes attached to GM NFTs correctly", async () => {
      const { vechainNodesMock, galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      await addNodeToken(1, otherAccount) // Mint Mock Strength Economy Node (Level 1)

      await participateInAllocationVoting(otherAccount)

      await galaxyMember.connect(otherAccount).freeMint()

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1
      expect(await galaxyMember.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first NFT is the owner

      expect(await galaxyMember.getNodeToFreeLevel(1)).to.equal(2) // Strength Economy Node attached to GM NFT => Level 2
      expect(await galaxyMember.getNodeToFreeLevel(2)).to.equal(4) // Thunder Economy Node attached to GM NFT => Level 3
      expect(await galaxyMember.getNodeToFreeLevel(3)).to.equal(6) // Mjolnir Economy Node attached to GM NFT => Level 4
      expect(await galaxyMember.getNodeToFreeLevel(4)).to.equal(2) // VethorX X Node attached to GM NFT => Level 2
      expect(await galaxyMember.getNodeToFreeLevel(5)).to.equal(4) // StrengthX X Node attached to GM NFT => Level 4
      expect(await galaxyMember.getNodeToFreeLevel(6)).to.equal(6) // ThunderX X Node attached to GM NFT => Level 6
      expect(await galaxyMember.getNodeToFreeLevel(7)).to.equal(7) // MjolnirX X Node attached to GM NFT => Level 7

      await galaxyMember.setMaxLevel(10)

      // Attach Strength Economy Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level 2

      // Attach Thunder Economy Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).detachNode(1, 0)

      await vechainNodesMock.upgradeTo(1, 2)

      await galaxyMember.connect(otherAccount).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(4) // Level 4

      // Attach Mjolnir Economy Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).detachNode(1, 0)

      await vechainNodesMock.upgradeTo(1, 3)

      await galaxyMember.connect(otherAccount).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(6) // Level 6

      // Attach VethorX X Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).detachNode(1, 0)

      await vechainNodesMock.upgradeTo(1, 4)

      await galaxyMember.connect(otherAccount).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level 2

      // Attach StrengthX X Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).detachNode(1, 0)

      await vechainNodesMock.upgradeTo(1, 5)

      await galaxyMember.connect(otherAccount).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(4) // Level 4

      // Attach ThunderX X Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).detachNode(1, 0)

      await vechainNodesMock.upgradeTo(1, 6)

      await galaxyMember.connect(otherAccount).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(6) // Level 6

      // Attach MjolnirX X Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).detachNode(1, 0)

      await vechainNodesMock.upgradeTo(1, 7)

      await galaxyMember.connect(otherAccount).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(7) // Level 7
    })

    it("Should not be able to attach a Vechain Node to a GM NFT if not the owner", async () => {
      const { owner, vechainNodesMock, galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      // Mint Mock Strength Economy Node (Level 1)
      const nodeMetadata1 = await addNodeToken(1, otherAccount)

      expect(await vechainNodesMock.idToOwner(1)).to.equal(await otherAccount.getAddress())

      expect(await vechainNodesMock.getMetadata(1)).to.deep.equal(nodeMetadata1)

      expect(await galaxyMember.getNodeLevelOf(1)).to.equal(1) // The Mock Vechain Node is Strength Economy Node which is Level 1

      await participateInAllocationVoting(otherAccount)

      await galaxyMember.connect(otherAccount).freeMint()

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1
      expect(await galaxyMember.ownerOf(0)).to.equal(await otherAccount.getAddress()) // Owner of the first NFT is the owner

      await expect(galaxyMember.connect(owner).attachNode(1, 0)).to.be.reverted // Should not be able to attach a node if not the owner
    })

    it("Should not be able to attach a Vechain Node to a GM NFT if not the owner of the node", async () => {
      const { owner, vechainNodesMock, galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      // Mint Mock Strength Economy Node (Level 1)
      const nodeMetadata = await addNodeToken(1, owner)

      expect(await vechainNodesMock.idToOwner(1)).to.equal(await owner.getAddress())

      expect(await vechainNodesMock.getMetadata(1)).to.deep.equal(nodeMetadata)

      expect(await galaxyMember.getNodeLevelOf(1)).to.equal(1) // The Mock Vechain Node is Strength Economy Node which is Level 1

      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1
      expect(await galaxyMember.ownerOf(0)).to.equal(await owner.getAddress()) // Owner of the first NFT is the owner

      await expect(galaxyMember.connect(otherAccount).attachNode(1, 0)).to.be.reverted // Should not be able to attach a node if not the owner of the node
    })

    it("Should be able to detach GM NFT from node after transfering the node", async () => {
      const { owner, vechainNodesMock, galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      // Mint Mock Strength Economy Node (Level 1)
      const nodeMetadata = await addNodeToken(1, owner)

      expect(await vechainNodesMock.idToOwner(1)).to.equal(await owner.getAddress())

      expect(await vechainNodesMock.getMetadata(1)).to.deep.equal(nodeMetadata)

      expect(await galaxyMember.getNodeLevelOf(1)).to.equal(1) // The Mock Vechain Node is Strength Economy Node which is Level 1

      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1
      expect(await galaxyMember.ownerOf(0)).to.equal(await owner.getAddress()) // Owner of the first NFT is the owner

      expect(await galaxyMember.getNodeToFreeLevel(1)).to.equal(2) // Strength Economy Node attached to GM NFT => Level 2

      await galaxyMember.setMaxLevel(2)

      // Attach Strength Economy Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(owner).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level 2

      expect(await galaxyMember.getNodeIdAttached(0)).to.equal(1) // Strength Economy Node (token ID 1) attached to GM NFT (token

      // Skip ahead 1 day to be able to transfer node
      await time.setNextBlockTimestamp((await time.latest()) + 86400)

      // Transfer Strength Economy Node to other account
      await vechainNodesMock.connect(owner).transferFrom(await owner.getAddress(), await otherAccount.getAddress(), 1)

      expect(await vechainNodesMock.idToOwner(1)).to.equal(await otherAccount.getAddress())

      expect(await galaxyMember.getNodeIdAttached(0)).to.equal(1) // Strength Economy Node (token ID 1) still attached to GM NFT (token ID 0)

      await galaxyMember.connect(otherAccount).detachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(1) // GM NFT Level is now 1 as no X Node is attached
    })

    it("Should be able to upgrade GM NFT attached to Vechain node", async () => {
      const { owner, vechainNodesMock, galaxyMember, b3tr, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      // Mint Mock Strength Economy Node (Level 1)
      await addNodeToken(1, owner)

      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.setMaxLevel(10)

      expect(await galaxyMember.getB3TRrequiredToUpgrade(2)).to.equal(await galaxyMember.getB3TRrequiredToUpgrade(0))

      await b3tr.connect(minterAccount).mint(owner, await galaxyMember.getB3TRrequiredToUpgrade(0))

      await b3tr.connect(owner).approve(await galaxyMember.getAddress(), await galaxyMember.getB3TRrequiredToUpgrade(0))

      await galaxyMember.connect(owner).upgrade(0) // Upgrade token id 1 to level 2

      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level 2

      /*
        Current state:

        - Token ID 0 has received 10,000 B3TR to upgrade to level 2
        - Token ID 0 has NO vechain node attached
      */

      // Attach Strength Economy Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(owner).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level remains 2 because Strength Economy Node is allows for Level 2 for Free but now b3tr to upgrade to level 3 is less as we've already donated 10,000 B3TR

      /*
        Current state:

        - Token ID 0 has received 10,000 B3TR to upgrade to level 2
        - Token ID 0 has Strength Economy Node attached
        - Token ID requires 15,000 B3TR to upgrade to level 3 instead of 25,000 B3TR as Strength Economy Node allows for Level 2 for Free and we've already donated 10,000 B3TR
      */
      expect(await galaxyMember.getB3TRrequiredToUpgrade(0)).to.equal(
        (await galaxyMember.getB3TRtoUpgradeToLevel(3)) - (await galaxyMember.getB3TRdonated(0)),
      )

      await b3tr.connect(minterAccount).mint(owner, await galaxyMember.getB3TRrequiredToUpgrade(0))

      await b3tr.connect(owner).approve(await galaxyMember.getAddress(), await galaxyMember.getB3TRrequiredToUpgrade(0))

      await galaxyMember.connect(owner).upgrade(0) // Upgrade token id 1 to level 2

      expect(await galaxyMember.levelOf(0)).to.equal(3) // Level 3

      await galaxyMember.detachNode(1, 0)

      /*
        Current state:

        - Token ID 0 has received 25,000 total B3TR
        - Token ID 0 has NO vechain node attached
        - Token ID 0 needs 10,000 B3TR to upgrade to level 3 as we've already donated 25,000 B3TR = 25,000 - 10,000 brings to Level 2 and have 15,000 left to upgrade to Level 3. Level 3 requires 25,000 B3TR so 25,000 - 15,000 = 10,000 B3TR required to upgrade to Level 3
      */

      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level 2 as we've detached the Strength Economy Node but we've already donated 25,000 B3TR

      expect(await galaxyMember.getB3TRdonated(0)).to.equal(ethers.parseEther("25000"))

      expect(await galaxyMember.getB3TRrequiredToUpgrade(0)).to.equal(ethers.parseEther("10000"))
    })

    it("Should correctly track B3TR required for upgrades when attaching and detaching nodes", async () => {
      const { vechainNodesMock, galaxyMember, otherAccount, b3tr, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      await addNodeToken(1, otherAccount) // Mint Mock Strength Economy Node (Level 1)

      await participateInAllocationVoting(otherAccount)

      await galaxyMember.connect(otherAccount).freeMint()

      await galaxyMember.setMaxLevel(10)

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1

      expect(await vechainNodesMock.ownerToId(otherAccount.address)).to.equal(1)
      expect(await vechainNodesMock.idToOwner(1)).to.equal(otherAccount.address)

      await vechainNodesMock.upgradeTo(1, 7)

      // Attach Mjolnir X Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(7) // Level 7

      await b3tr.connect(minterAccount).mint(otherAccount, await galaxyMember.getB3TRrequiredToUpgrade(0))

      await b3tr
        .connect(otherAccount)
        .approve(await galaxyMember.getAddress(), await galaxyMember.getB3TRrequiredToUpgrade(0))

      await galaxyMember.connect(otherAccount).upgrade(0) // Upgrade token id 1 to level 8 by donating 2,500,000 B3TR

      expect(await galaxyMember.levelOf(0)).to.equal(8) // Level 8

      // Detach Mjolnir X Node (token ID 1) from GM NFT (token ID 0)
      await galaxyMember.connect(otherAccount).detachNode(1, 0)

      /*
        Current state:

        - Token ID 0 has received 2,500,000 B3TR
        - Token ID 0 has NO vechain node attached
        - Token ID Level is level 7 with 1,565,000 B3TR left that can be used to upgrade to Level 8 => 2,500,000 - 1,565,000 = 935,000 B3TR required to upgrade to Level 8
      */
      expect(await galaxyMember.levelOf(0)).to.equal(7) // Level 7

      expect(await galaxyMember.getB3TRrequiredToUpgrade(0)).to.equal(ethers.parseEther("935000"))

      await b3tr.connect(minterAccount).mint(otherAccount, await galaxyMember.getB3TRrequiredToUpgrade(0))

      await b3tr
        .connect(otherAccount)
        .approve(await galaxyMember.getAddress(), await galaxyMember.getB3TRrequiredToUpgrade(0))

      await galaxyMember.connect(otherAccount).upgrade(0) // Upgrade token id 1 to level 8 by donating 935,000 B3TR

      expect(await galaxyMember.levelOf(0)).to.equal(8) // Level 8
    })

    it("Should not be able to transfer GM NFT attached to Vechain node", async () => {
      const { owner, vechainNodesMock, galaxyMember, otherAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      // Mint Mock Strength Economy Node (Level 1)
      await addNodeToken(1, owner)

      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.setMaxLevel(10)

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1

      // Attach Strength Economy Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(owner).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level 2

      await expect(galaxyMember.connect(owner).transferFrom(owner.address, otherAccount.address, 0)).to.be.revertedWith(
        "GalaxyMember: token attached to a node, detach before transfer",
      )
    })

    it("Should reset level if node attached doesn't exist anymore", async () => {
      const { owner, vechainNodesMock, galaxyMember } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      // Mint Mock Strength Economy Node (Level 1)
      await addNodeToken(1, owner)

      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.setMaxLevel(10)

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1

      // Attach Strength Economy Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(owner).attachNode(1, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(2) // Level 2

      // Fast forward 4 hours
      await time.setNextBlockTimestamp((await time.latest()) + 4 * 60 * 60)

      await vechainNodesMock.downgradeTo(1, 0) // Burn Strength Economy Node

      expect(await vechainNodesMock.idToOwner(1)).to.equal(ethers.ZeroAddress)

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1

      // I can attach another node
      await addNodeToken(2, owner)

      await expect(galaxyMember.connect(owner).attachNode(2, 0)).to.be.revertedWith(
        "GalaxyMember: token already attached to a node",
      )

      await galaxyMember.connect(owner).detachNode(await galaxyMember.getNodeIdAttached(0), 0)

      await galaxyMember.connect(owner).attachNode(2, 0)

      expect(await galaxyMember.levelOf(0)).to.equal(4) // Level 4
    })

    it("User can select a different GM NFT owned", async () => {
      const { owner, vechainNodesMock, galaxyMember } = await getOrDeployContractInstances({
        forceDeploy: true,
        deployMocks: true,
      })

      if (!vechainNodesMock) throw new Error("VechainNodesMock not deployed")

      await galaxyMember.setVechainNodes(await vechainNodesMock.getAddress())

      // Mint Mock Strength Economy Node (Level 1)
      await addNodeToken(1, owner)

      await participateInAllocationVoting(owner)

      await galaxyMember.connect(owner).freeMint()

      await galaxyMember.setMaxLevel(10)

      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1

      await galaxyMember.connect(owner).freeMint()

      // Attach Strength Economy Node (token ID 1) to GM NFT (token ID 0)
      await galaxyMember.connect(owner).attachNode(1, 1)

      expect(await galaxyMember.levelOf(1)).to.equal(2) // Level 1
      expect(await galaxyMember.levelOf(0)).to.equal(1) // Level 1

      expect(await galaxyMember.getSelectedTokenId(await owner.getAddress())).to.equal(0) // Owner has selected token ID 0 automatically as it was the first token owned

      await galaxyMember.select(1)

      expect(await galaxyMember.getSelectedTokenId(await owner.getAddress())).to.equal(1) // Owner has selected token ID 1
    })
  })
})
