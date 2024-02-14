import { describe, it } from "mocha"
import {
  INITIAL_EMISSIONS,
  PRE_MINT_TREASURY_ALLOCATION,
  PRE_MINT_VOTE_2_EARN_ALLOCATION,
  PRE_MINT_X_ALLOCATION,
  catchRevert,
  getOrDeployContractInstances,
  moveToCycle,
  waitForBlock,
  waitForNextCycle,
} from "./helpers"
import { expect } from "chai"
import { ethers, network } from "hardhat"
import b3trAllocations from "./fixture/b3trAllocations.json"

describe("Emissions", () => {
  describe("Contract parameters", () => {
    it("Should have correct parameters set on deployment", async () => {
      const { emissions, owner, otherAccounts, b3tr, minterAccount, xAllocationPool, voterRewards } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Destination addresses should be set correctly
      expect(await emissions.xAllocations()).to.equal(await xAllocationPool.getAddress())
      expect(await emissions.vote2Earn()).to.equal(await voterRewards.getAddress())
      expect(await emissions.treasury()).to.equal(otherAccounts[2].address)

      // Admin should be set correctly
      expect(await emissions.hasRole(await emissions.DEFAULT_ADMIN_ROLE(), await owner.getAddress())).to.equal(true)

      // Minter should be set correctly
      expect(await emissions.hasRole(await emissions.MINTER_ROLE(), await minterAccount.getAddress())).to.equal(true)

      // Pre-mint allocation amounts should be set correctly
      const allocations = await emissions.getPreMintAllocations()
      expect(allocations.length).to.equal(3)
      expect(allocations[0]).to.equal(PRE_MINT_X_ALLOCATION)
      expect(allocations[1]).to.equal(PRE_MINT_VOTE_2_EARN_ALLOCATION)
      expect(allocations[2]).to.equal(PRE_MINT_TREASURY_ALLOCATION)

      // B3TR address should be set correctly
      expect(await emissions.b3tr()).to.equal(await b3tr.getAddress())

      // Decay settings should be set correctly
      expect(await emissions.xAllocationsDecay()).to.equal(4)
      expect(await emissions.vote2EarnDecay()).to.equal(20)
      expect(await emissions.xAllocationsDecayDelay()).to.equal(12)
      expect(await emissions.vote2EarnDecayDelay()).to.equal(50)

      // Initial emissions should be set correctly
      expect(await emissions.initialEmissions()).to.equal(ethers.parseEther("2000000"))

      // Treasury percentage should be set correctly
      expect(await emissions.treasuryPercentage()).to.equal(25)
    })

    it("Should be able to change the X allocations address", async () => {
      const { emissions, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await emissions.connect(owner).setXallocationsAddress(otherAccounts[3].address)

      expect(await emissions.xAllocations()).to.equal(otherAccounts[3].address)
    })

    it("Should be able to change the Vote 2 Earn address", async () => {
      const { emissions, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await emissions.connect(owner).setVote2EarnAddress(otherAccounts[3].address)

      expect(await emissions.vote2Earn()).to.equal(otherAccounts[3].address)
    })

    it("Should be able to change the Treasury address", async () => {
      const { emissions, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await emissions.connect(owner).setTreasuryAddress(otherAccounts[3].address)

      expect(await emissions.treasury()).to.equal(otherAccounts[3].address)
    })

    it("Should not be able to change the X allocations address if not admin", async () => {
      const { emissions, otherAccounts } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      await catchRevert(emissions.connect(otherAccounts[0]).setXallocationsAddress(otherAccounts[3].address))
    })
  })

  describe("Pre-minting", () => {
    it("Should be able to pre-mint tokens", async () => {
      const { emissions, b3tr, minterAccount, otherAccounts, owner, xAllocationPool, voterRewards } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      await emissions.connect(minterAccount).preMint()

      expect(await b3tr.balanceOf(await xAllocationPool.getAddress())).to.equal(PRE_MINT_X_ALLOCATION)
      expect(await b3tr.balanceOf(await voterRewards.getAddress())).to.equal(PRE_MINT_VOTE_2_EARN_ALLOCATION)
      expect(await b3tr.balanceOf(otherAccounts[2].address)).to.equal(PRE_MINT_TREASURY_ALLOCATION)

      expect(await emissions.getXAllocationAmountForCycle(1)).to.equal(PRE_MINT_X_ALLOCATION)
      expect(await emissions.getVote2EarnAmountForCycle(1)).to.equal(PRE_MINT_VOTE_2_EARN_ALLOCATION)
      expect(await emissions.getTreasuryAmountForCycle(1)).to.equal(PRE_MINT_TREASURY_ALLOCATION)

      expect(await emissions.nextCycle()).to.equal(2)
    })

    it("Should not be able to pre-mint tokens twice", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Pre-mint
      await emissions.connect(minterAccount).preMint()

      // Try to pre-mint again - Should revert
      await catchRevert(emissions.connect(minterAccount).preMint())
    })

    it("Should be able to pre-mint different amounts than deployment", async () => {
      const { emissions, b3tr, minterAccount, otherAccounts, owner, xAllocationPool, voterRewards } =
        await getOrDeployContractInstances({
          forceDeploy: true,
        })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Pre-mint allocation amounts should be set correctly
      await emissions
        .connect(owner)
        .setPreMintAllocations([ethers.parseEther("100"), ethers.parseEther("200"), ethers.parseEther("300")])

      expect(await emissions.getPreMintAllocations()).to.deep.equal([
        ethers.parseEther("100"),
        ethers.parseEther("200"),
        ethers.parseEther("300"),
      ])

      // Pre-mint
      await emissions.connect(minterAccount).preMint()

      expect(await b3tr.balanceOf(await xAllocationPool.getAddress())).to.equal(ethers.parseEther("100"))
      expect(await b3tr.balanceOf(await voterRewards.getAddress())).to.equal(ethers.parseEther("200"))
      expect(await b3tr.balanceOf(otherAccounts[2].address)).to.equal(ethers.parseEther("300"))
    })
  })

  describe("Emissions distribution", () => {
    it("Should be able to calculate emissions correctly for first cycle", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Pre-mint
      await emissions.connect(minterAccount).preMint()

      // Expect current cycle to be 0
      expect(await emissions.nextCycle()).to.equal(2)

      await waitForNextCycle(emissions)

      // Calculate emissions for first cycle
      const xAllocationsAmount = await emissions.getCurrentXAllocationsAmount()
      const vote2EarnAmount = await emissions.getCurrentVote2EarnAmount()
      const treasuryAmount = await emissions.getCurrentTreasuryAmount()

      expect(xAllocationsAmount).to.equal(ethers.parseEther("2000000"))
      expect(vote2EarnAmount).to.equal(ethers.parseEther("2000000"))
      expect(treasuryAmount).to.equal(ethers.parseEther("1000000"))

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(
        ethers.parseEther("5000000") +
          PRE_MINT_X_ALLOCATION +
          PRE_MINT_VOTE_2_EARN_ALLOCATION +
          PRE_MINT_TREASURY_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(
        ethers.parseEther("2000000") + PRE_MINT_X_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(
        ethers.parseEther("2000000") + PRE_MINT_VOTE_2_EARN_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(
        ethers.parseEther("1000000") + PRE_MINT_TREASURY_ALLOCATION,
      )
    })

    it("Should not be able to distribute emissions before next cycle starts", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Pre-mint
      await emissions.connect(minterAccount).preMint()

      expect(await emissions.nextCycle()).to.equal(2)

      // Calculate emissions for first cycle
      const xAllocationsAmount = await emissions.getCurrentXAllocationsAmount()
      const vote2EarnAmount = await emissions.getCurrentVote2EarnAmount()
      const treasuryAmount = await emissions.getCurrentTreasuryAmount()

      expect(xAllocationsAmount).to.equal(ethers.parseEther("2000000"))
      expect(vote2EarnAmount).to.equal(ethers.parseEther("2000000"))
      expect(treasuryAmount).to.equal(ethers.parseEther("1000000"))

      // Try to distribute emissions before next cycle starts - Should revert
      await catchRevert(emissions.connect(minterAccount).distribute())
    })

    it("Should be able to calculate emissions correctly for second cycle", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Pre-mint
      await emissions.connect(minterAccount).preMint()

      await waitForNextCycle(emissions)

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      expect(await emissions.isCycleDistributed(2)).to.equal(true)

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(
        ethers.parseEther("5000000") +
          PRE_MINT_X_ALLOCATION +
          PRE_MINT_VOTE_2_EARN_ALLOCATION +
          PRE_MINT_TREASURY_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(
        ethers.parseEther("2000000") + PRE_MINT_X_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(
        ethers.parseEther("2000000") + PRE_MINT_VOTE_2_EARN_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(
        ethers.parseEther("1000000") + PRE_MINT_TREASURY_ALLOCATION,
      )

      await waitForNextCycle(emissions)

      // Calculate emissions for second cycle
      const xAllocationsAmount = await emissions.getCurrentXAllocationsAmount()
      const vote2EarnAmount = await emissions.getCurrentVote2EarnAmount()
      const treasuryAmount = await emissions.getCurrentTreasuryAmount()

      expect(xAllocationsAmount).to.equal(ethers.parseEther("2000000"))
      expect(vote2EarnAmount).to.equal(ethers.parseEther("2000000"))
      expect(treasuryAmount).to.equal(ethers.parseEther("1000000"))

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      expect(await emissions.isCycleDistributed(3)).to.equal(true)

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(
        ethers.parseEther("10000000") +
          PRE_MINT_X_ALLOCATION +
          PRE_MINT_VOTE_2_EARN_ALLOCATION +
          PRE_MINT_TREASURY_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(
        ethers.parseEther("4000000") + PRE_MINT_X_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(
        ethers.parseEther("4000000") + PRE_MINT_VOTE_2_EARN_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(
        ethers.parseEther("2000000") + PRE_MINT_TREASURY_ALLOCATION,
      )

      expect(await emissions.nextCycle()).to.equal(4)
    })

    it("Should calculate emissions properly after first decay period", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Pre-mint
      await emissions.connect(minterAccount).preMint()

      await waitForNextCycle(emissions)

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(
        ethers.parseEther("5000000") +
          PRE_MINT_X_ALLOCATION +
          PRE_MINT_VOTE_2_EARN_ALLOCATION +
          PRE_MINT_TREASURY_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(
        ethers.parseEther("2000000") + PRE_MINT_X_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(
        ethers.parseEther("2000000") + PRE_MINT_VOTE_2_EARN_ALLOCATION,
      )
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(
        ethers.parseEther("1000000") + PRE_MINT_TREASURY_ALLOCATION,
      )

      // Move to the 14th cycle
      await moveToCycle(emissions, minterAccount, 14)

      expect(await emissions.nextCycle()).to.equal(14)

      await waitForNextCycle(emissions)

      const xAllocationsAmount = await emissions.getCurrentXAllocationsAmount()
      const vote2EarnAmount = await emissions.getCurrentVote2EarnAmount()
      const treasuryAmount = await emissions.getCurrentTreasuryAmount()

      // Expect X allocations to decay by 4%
      expect(xAllocationsAmount).to.equal(ethers.parseEther("1920000"))
      expect(vote2EarnAmount).to.equal(ethers.parseEther("1920000"))
      expect(treasuryAmount).to.equal(ethers.parseEther("960000"))

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

      // Check supply
      expect(await b3tr.totalSupply()).to.equal(ethers.parseEther("68550000"))
      expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(ethers.parseEther("26920000"))
      expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(ethers.parseEther("26920000"))
      expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(ethers.parseEther("14710000"))
    }).timeout(1000 * 60 * 10) // 10 minutes
  })

  it("Should calculate decay amounts correctly over 634 cycles", async () => {
    const { emissions, owner, minterAccount, b3tr } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    // Grant minter role to emissions contract
    await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

    expect(await emissions.nextCycle()).to.equal(1)

    // Pre-mint
    await emissions.connect(minterAccount).preMint()

    // Variables to hold calculated amounts for assertions
    let xAllocationsAmount = INITIAL_EMISSIONS
    let vote2EarnAmount = INITIAL_EMISSIONS
    let treasuryAmount = (INITIAL_EMISSIONS * BigInt(2)) / BigInt(4)

    expect(await emissions.nextCycle()).to.equal(2)

    // Loop through 633 cycles as simulated in the b3tr emissions spreadsheet
    for (let i = 0; i < b3trAllocations.length; i++) {
      await waitForNextCycle(emissions)

      // Calculate decayed amounts
      xAllocationsAmount = await emissions.getCurrentXAllocationsAmount()
      vote2EarnAmount = await emissions.getCurrentVote2EarnAmount()
      treasuryAmount = await emissions.getCurrentTreasuryAmount()

      // Log the cycle and amounts for debugging
      // Uncomment to view the emissions for each cycle
      /* console.log(
        `Cycle ${i + 2}: XAllocations = ${ethers.formatEther(xAllocationsAmount)}, Vote2Earn = ${ethers.formatEther(vote2EarnAmount)}`,
        `Treasury = ${ethers.formatEther(treasuryAmount)}`,
      ) */

      // Assert the calculated amounts match the expected amounts from the spreadsheet
      expect(Math.floor(Number(ethers.formatEther(xAllocationsAmount)))).to.equal(
        Math.floor(Number(b3trAllocations[i].xAllocation)),
      )
      expect(Math.floor(Number(ethers.formatEther(vote2EarnAmount)))).to.equal(
        Math.floor(Number(b3trAllocations[i].vote2EarnAllocation)),
      )
      expect(Math.floor(Number(ethers.formatEther(treasuryAmount)))).to.equal(
        Math.floor(Number(b3trAllocations[i].treasuryAllocation)),
      )

      await emissions.distribute()

      expect(await emissions.getXAllocationAmountForCycle(i + 2)).to.equal(xAllocationsAmount)
      expect(await emissions.getVote2EarnAmountForCycle(i + 2)).to.equal(vote2EarnAmount)
      expect(await emissions.getTreasuryAmountForCycle(i + 2)).to.equal(treasuryAmount)

      expect(await emissions.getCurrentCycle()).to.equal(i + 2)
    }
  }).timeout(1000 * 60 * 5) // 5 minutes

  it("Should not be able to pre mint emissions if not minter", async () => {
    const { emissions, minterAccount } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    await catchRevert(emissions.connect(minterAccount).preMint())
  })

  it("Should be able to perform all cycles till reaching B3TR supply cap", async function () {
    if (network.name !== "hardhat") {
      console.log(`\nThe test "${this?.test?.title}" is only supported on hardhat network. Skipping...\n`)
      return
    }
    const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    // Grant minter role to emissions contract
    await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

    // Pre-mint
    await emissions.connect(minterAccount).preMint()

    await waitForNextCycle(emissions)

    // Distribute emissions
    await emissions.connect(minterAccount).distribute()

    // Check supply
    expect(await b3tr.totalSupply()).to.equal(
      ethers.parseEther("5000000") +
        PRE_MINT_X_ALLOCATION +
        PRE_MINT_VOTE_2_EARN_ALLOCATION +
        PRE_MINT_TREASURY_ALLOCATION,
    )
    expect(await b3tr.balanceOf(await emissions.xAllocations())).to.equal(
      ethers.parseEther("2000000") + PRE_MINT_X_ALLOCATION,
    )
    expect(await b3tr.balanceOf(await emissions.vote2Earn())).to.equal(
      ethers.parseEther("2000000") + PRE_MINT_VOTE_2_EARN_ALLOCATION,
    )
    expect(await b3tr.balanceOf(await emissions.treasury())).to.equal(
      ethers.parseEther("1000000") + PRE_MINT_TREASURY_ALLOCATION,
    )

    const lastCycle = b3trAllocations.length + 2

    // Move to the last cycle (634 cycles in the allocations spreadsheet)
    await moveToCycle(emissions, minterAccount, lastCycle)

    expect(await emissions.nextCycle()).to.equal(lastCycle)

    await waitForNextCycle(emissions)

    expect(await emissions.isLastCycle()).to.equal(true)

    expect(await emissions.getRemainingEmissions()).to.equal(115954859940312834277586n) // 115954.85 B3TR

    expect(await emissions.getLastXAllocationsAmount()).to.equal(76530207560606470623206n) // 76530.21 B3TR
    expect(await emissions.getLastVote2EarnAmount()).to.equal(15074131792240668456086n) // 15074.13 B3TR
    expect(await emissions.getLastTreasuryAmount()).to.equal(24350520587465695198294n) // 24350.52 B3TR

    // Distribute emissions
    await catchRevert(emissions.connect(minterAccount).distribute()) // Should revert as the supply cap is reached

    await waitForNextCycle(emissions)

    // Should be able to call distributeLast()
    await emissions.connect(minterAccount).distributeLast()

    // Check supply
    expect(await b3tr.totalSupply()).to.equal(ethers.parseEther("1000000000")) // 1 billion B3TR
  }).timeout(1000 * 60 * 5) // 5 minutes

  it("Should not be able to call the last distribution round if b3tr supply cap is not exceeded by normal distribution", async () => {
    const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    // Grant minter role to emissions contract
    await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

    // Pre-mint
    await emissions.connect(minterAccount).preMint()

    // Distribute last emissions should revert as the b3tr supply cap is not reached
    await catchRevert(emissions.connect(minterAccount).distributeLast())
  })

  it("Should not be able to distribute if cycle is not ready", async () => {
    const { emissions, minterAccount, b3tr, owner } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    // Grant minter role to emissions contract
    await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

    // Pre-mint
    await emissions.connect(minterAccount).preMint()

    await waitForNextCycle(emissions)

    // Distribute emissions
    await emissions.connect(minterAccount).distribute()

    await catchRevert(emissions.connect(minterAccount).distribute())
  })

  it("Should be able to perform emissions also after the next cycle block", async () => {
    const { emissions, minterAccount, b3tr, owner } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    // Grant minter role to emissions contract
    await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

    // Pre-mint
    await emissions.connect(minterAccount).preMint()

    await waitForNextCycle(emissions)

    // Distribute emissions
    await emissions.connect(minterAccount).distribute()

    await waitForNextCycle(emissions)

    await waitForBlock(10) // Simulate a delay of 10 blocks before distributing the next cycle

    await emissions.connect(minterAccount).distribute()

    expect(await emissions.getCurrentCycle()).to.equal(3)

    await waitForNextCycle(emissions)

    await emissions.connect(minterAccount).distribute()
  })
})
