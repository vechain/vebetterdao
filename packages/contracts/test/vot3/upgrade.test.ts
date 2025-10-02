const { ethers } = require("hardhat")
import { expect } from "chai"
import { describe, it } from "mocha"
import { deployProxy, upgradeProxy } from "../../scripts/helpers/upgrades"
import { getOrDeployContractInstances } from "../helpers/deploy"
import { VOT3, VOT3V1 } from "../../typechain-types"

describe("VOT3 Upgrade - @shard9a", function () {
  it("Should upgrade from V1 to V2 and preserve storage while adding auto-voting disable logic", async () => {
    const contractConfig = await getOrDeployContractInstances({
      forceDeploy: true,
    })
    if (!contractConfig) throw new Error("Failed to deploy contracts")

    const { otherAccounts, otherAccount: voter1, owner, b3tr, xAllocationVoting } = contractConfig

    // Deploy VOT3 V1 from scratch to test upgrade
    const vot3V1 = (await deployProxy("VOT3V1", [
      owner.address,
      owner.address,
      owner.address,
      await b3tr.getAddress(),
    ])) as VOT3V1

    const voter2 = otherAccounts[1]
    const voter3 = otherAccounts[2]

    // Get VOT3 tokens for testing
    const { minterAccount } = contractConfig

    // Mint some B3TR
    await b3tr.connect(minterAccount).mint(voter1.address, ethers.parseEther("1000"))
    await b3tr.connect(minterAccount).mint(voter2.address, ethers.parseEther("2000"))
    await b3tr.connect(minterAccount).mint(voter3.address, ethers.parseEther("500"))

    // Approve VOT3 to spend B3TR on behalf of voters
    await b3tr.connect(voter1).approve(await vot3V1.getAddress(), ethers.parseEther("1000"))
    await b3tr.connect(voter2).approve(await vot3V1.getAddress(), ethers.parseEther("2000"))
    await b3tr.connect(voter3).approve(await vot3V1.getAddress(), ethers.parseEther("500"))

    // Lock B3TR to get VOT3
    await vot3V1.connect(voter1).convertToVOT3(ethers.parseEther("1000"))
    await vot3V1.connect(voter2).convertToVOT3(ethers.parseEther("2000"))
    await vot3V1.connect(voter3).convertToVOT3(ethers.parseEther("500"))

    // Verify initial balances
    expect(await vot3V1.balanceOf(voter1.address)).to.equal(ethers.parseEther("1000"))
    expect(await vot3V1.balanceOf(voter2.address)).to.equal(ethers.parseEther("2000"))
    expect(await vot3V1.balanceOf(voter3.address)).to.equal(ethers.parseEther("500"))

    // Verify V1 version
    expect(await vot3V1.version()).to.equal("1")

    // ========================================
    // STORAGE VERIFICATION BEFORE UPGRADE
    // ========================================
    let storageSlots: string[] = []
    const initialSlot = BigInt("0x8af7882bba84ab51775aa801e199e7d1dfd5f5ff08dcfbb73c614b3313e4cb00") // VOT3StorageLocation

    // Read storage slots before upgrade
    for (let i = initialSlot; i < initialSlot + BigInt(10); i++) {
      storageSlots.push(await ethers.provider.getStorage(await vot3V1.getAddress(), i))
    }

    // Filter out empty slots
    storageSlots = storageSlots.filter(
      slot => slot !== "0x0000000000000000000000000000000000000000000000000000000000000000",
    )

    // ========================================
    // UPGRADE TO V2
    // ========================================
    const vot3V2 = (await upgradeProxy(
      "VOT3V1",
      "VOT3",
      await vot3V1.getAddress(),
      [await xAllocationVoting.getAddress()], // xAllocationVoting v8 to be compatible with VOT3 v2
      {
        version: 2,
      },
    )) as VOT3

    // ========================================
    // STORAGE VERIFICATION AFTER UPGRADE
    // ========================================
    let storageSlotsAfter: string[] = []

    for (let i = initialSlot; i < initialSlot + BigInt(10); i++) {
      storageSlotsAfter.push(await ethers.provider.getStorage(await vot3V2.getAddress(), i))
    }

    // Check if storage slots are preserved after upgrade
    for (let i = 0; i < storageSlots.length; i++) {
      expect(storageSlots[i]).to.equal(storageSlotsAfter[i], `Storage slot ${i} should be preserved`)
    }

    // ========================================
    // VERIFY V2 FUNCTIONALITY
    // ========================================
    expect(await vot3V2.version()).to.equal("2")
    expect(await xAllocationVoting.version()).to.equal("8")

    // Verify balances preserved
    expect(await vot3V2.balanceOf(voter1.address)).to.equal(ethers.parseEther("1000"))
    expect(await vot3V2.balanceOf(voter2.address)).to.equal(ethers.parseEther("2000"))
    expect(await vot3V2.balanceOf(voter3.address)).to.equal(ethers.parseEther("500"))

    // Verify converted B3TR amounts preserved
    expect(await vot3V2.convertedB3trOf(voter1.address)).to.equal(ethers.parseEther("1000"))
    expect(await vot3V2.convertedB3trOf(voter2.address)).to.equal(ethers.parseEther("2000"))
    expect(await vot3V2.convertedB3trOf(voter3.address)).to.equal(ethers.parseEther("500"))

    // ========================================
    // TEST BASIC TRANSFER FUNCTIONALITY
    // ========================================

    // Test normal transfers work correctly
    await vot3V2.connect(voter1).transfer(voter2.address, ethers.parseEther("500"))
    expect(await vot3V2.balanceOf(voter1.address)).to.equal(ethers.parseEther("500"))
    expect(await vot3V2.balanceOf(voter2.address)).to.equal(ethers.parseEther("2500"))

    // Test transfers leaving small amounts
    await vot3V2.connect(voter1).transfer(voter2.address, ethers.parseEther("499"))
    expect(await vot3V2.balanceOf(voter1.address)).to.equal(ethers.parseEther("1"))
    expect(await vot3V2.balanceOf(voter2.address)).to.equal(ethers.parseEther("2999"))

    // Test transfers to zero balance
    await vot3V2.connect(voter1).transfer(voter2.address, ethers.parseEther("1"))
    expect(await vot3V2.balanceOf(voter1.address)).to.equal(0)
    expect(await vot3V2.balanceOf(voter2.address)).to.equal(ethers.parseEther("3000"))

    // Test receiving tokens
    await vot3V2.connect(voter2).transfer(voter1.address, ethers.parseEther("100"))
    expect(await vot3V2.balanceOf(voter1.address)).to.equal(ethers.parseEther("100"))
    expect(await vot3V2.balanceOf(voter2.address)).to.equal(ethers.parseEther("2900"))

    // ========================================
    // VERIFY BASIC TOKEN FUNCTIONALITY STILL WORKS
    // ========================================

    // Test minting via conversion still works - mint additional B3TR since voter1 used all B3TR earlier
    await b3tr.connect(minterAccount).mint(voter1.address, ethers.parseEther("100"))
    await b3tr.connect(voter1).approve(await vot3V2.getAddress(), ethers.parseEther("100"))
    await vot3V2.connect(voter1).convertToVOT3(ethers.parseEther("100"))

    expect(await vot3V2.balanceOf(voter1.address)).to.equal(ethers.parseEther("200"))
    expect(await vot3V2.convertedB3trOf(voter1.address)).to.equal(ethers.parseEther("1100"))

    // Test burning via conversion still works
    await vot3V2.connect(voter1).convertToB3TR(ethers.parseEther("50"))
    expect(await vot3V2.balanceOf(voter1.address)).to.equal(ethers.parseEther("150"))
    expect(await vot3V2.convertedB3trOf(voter1.address)).to.equal(ethers.parseEther("1050"))

    // ========================================
    // VERIFY VOTING POWER CALCULATIONS WORK
    // ========================================

    // Test quadratic voting power calculation
    const votingPower = await vot3V2.getQuadraticVotingPower(voter3.address)
    const voter3Balance = await vot3V2.balanceOf(voter3.address)

    // Expected power: sqrt(balance_in_wei) * 1e9, then convert to ether for comparison
    const expectedPowerWei = Math.sqrt(Number(voter3Balance)) * 1e9
    const expectedPower = expectedPowerWei / 1e18 // Convert to ether

    // Convert votingPower from wei to ether for comparison
    expect(Number(ethers.formatEther(votingPower))).to.be.closeTo(expectedPower, 0.1)

    // ========================================
    // FINAL STATE INTEGRITY CHECK
    // ========================================

    // Verify contract is still functional
    expect(await vot3V2.name()).to.equal("VOT3")
    expect(await vot3V2.symbol()).to.equal("VOT3")
    expect(await vot3V2.version()).to.equal("2")

    // Verify roles are preserved
    expect(await vot3V2.hasRole(await vot3V2.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true
    expect(await vot3V2.hasRole(await vot3V2.UPGRADER_ROLE(), owner.address)).to.be.true
    expect(await vot3V2.hasRole(await vot3V2.PAUSER_ROLE(), owner.address)).to.be.true

    // Verify B3TR reference is preserved
    expect(await vot3V2.b3tr()).to.equal(await b3tr.getAddress())

    // Verify total supply is consistent
    const totalSupply = await vot3V2.totalSupply()
    const expectedTotalSupply =
      ethers.parseEther("150") + // voter1 remaining (100 + 50 from conversion test) + minted B3TR
      ethers.parseEther("2900") + // voter2 remaining
      ethers.parseEther("500") // voter3 total
    expect(totalSupply).to.equal(expectedTotalSupply)
  })
})
