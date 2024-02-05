import { describe, it } from "mocha"
import {
  CYCLE_DURATION,
  INITIAL_EMISSIONS,
  PRE_MINT_TREASURY_ALLOCATION,
  PRE_MINT_VOTE_2_EARN_ALLOCATION,
  PRE_MINT_X_ALLOCATION,
  catchRevert,
  getCellsRange,
  getOrDeployContractInstances,
  moveToCycle,
  readExcel,
  waitForNextCycle,
  waitUntilTimestamp,
} from "./helpers"
import { expect } from "chai"
import { ethers } from "hardhat"
import path from "path"

describe("Emissions", () => {
  describe("Contract parameters", () => {
    it("Should have correct parameters set on deployment", async () => {
      const { emissions, owner, otherAccounts, b3tr, minterAccount } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Destination addresses should be set correctly
      expect(await emissions.xAllocations()).to.equal(otherAccounts[0].address)
      expect(await emissions.vote2Earn()).to.equal(otherAccounts[1].address)
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
      const { emissions, b3tr, minterAccount, otherAccounts, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      await emissions.connect(minterAccount).preMint()

      expect(await b3tr.balanceOf(otherAccounts[0].address)).to.equal(PRE_MINT_X_ALLOCATION)
      expect(await b3tr.balanceOf(otherAccounts[1].address)).to.equal(PRE_MINT_VOTE_2_EARN_ALLOCATION)
      expect(await b3tr.balanceOf(otherAccounts[2].address)).to.equal(PRE_MINT_TREASURY_ALLOCATION)
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
      const { emissions, b3tr, minterAccount, otherAccounts, owner } = await getOrDeployContractInstances({
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

      expect(await b3tr.balanceOf(otherAccounts[0].address)).to.equal(ethers.parseEther("100"))
      expect(await b3tr.balanceOf(otherAccounts[1].address)).to.equal(ethers.parseEther("200"))
      expect(await b3tr.balanceOf(otherAccounts[2].address)).to.equal(ethers.parseEther("300"))
    })
  })

  describe("Emissions", () => {
    it("Should be able to calculate emissions correctly for first cycle", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Pre-mint
      await emissions.connect(minterAccount).preMint()

      await waitUntilTimestamp(Number(await emissions.START_TIME()) + 1)

      const currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())

      // Expect START_TIME to be less than or equal to current time
      expect(Number(await emissions.START_TIME())).to.be.lte(currentBlock?.timestamp)

      // Expect current cycle to be 0
      expect(await emissions.nextCycle()).to.equal(0)

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

      await waitUntilTimestamp(Number(await emissions.START_TIME()) + 1)

      const currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())

      // Expect START_TIME to be less than or equal to current time
      expect(Number(await emissions.START_TIME())).to.be.lte(currentBlock?.timestamp)

      // Expect current cycle to be 0
      expect(await emissions.nextCycle()).to.equal(0)

      // Calculate emissions for first cycle
      const xAllocationsAmount = await emissions.getCurrentXAllocationsAmount()
      const vote2EarnAmount = await emissions.getCurrentVote2EarnAmount()
      const treasuryAmount = await emissions.getCurrentTreasuryAmount()

      expect(xAllocationsAmount).to.equal(ethers.parseEther("2000000"))
      expect(vote2EarnAmount).to.equal(ethers.parseEther("2000000"))
      expect(treasuryAmount).to.equal(ethers.parseEther("1000000"))

      // Distribute emissions
      await emissions.connect(minterAccount).distribute()

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

      await waitUntilTimestamp(Number(await emissions.START_TIME()) + 1)

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
    })

    it("Should calculate emissions properly after first decay period", async () => {
      const { emissions, b3tr, minterAccount, owner } = await getOrDeployContractInstances({
        forceDeploy: true,
      })

      // Grant minter role to emissions contract
      await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

      // Pre-mint
      await emissions.connect(minterAccount).preMint()

      await waitUntilTimestamp(Number(await emissions.START_TIME()) + 1)

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

      // Move to the 11th cycle
      await moveToCycle(emissions, minterAccount, 11)

      // Waiting for the 12th cycle
      await waitForNextCycle(emissions)

      expect(await emissions.nextCycle()).to.equal(12)

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
    }).timeout(1000 * 60 * 5) // 5 minutes
  })

  // 634 cycles is the amount of cycles simulated in spreadsheet
  it("Should calculate decay amounts correctly over 634 cycles", async () => {
    const { emissions } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    const sheet = await readExcel(path.resolve(__dirname, "fixture/Emissions.xlsx"))
    const expectedXAllocationsAmounts = getCellsRange(sheet, "B18:B650")
    const expectedVote2EarnAmounts = getCellsRange(sheet, "C18:C650")
    const expectedTreasuryAmounts = getCellsRange(sheet, "E18:E650")

    // Variables to hold calculated amounts for assertions
    let xAllocationsAmount = INITIAL_EMISSIONS
    let vote2EarnAmount = INITIAL_EMISSIONS
    let treasuryAmount = (INITIAL_EMISSIONS * BigInt(2)) / BigInt(4)

    const START_TIME = Number(await emissions.START_TIME())

    // Loop through 634 cycles as simulated in the b3tr emissions spreadsheet
    for (let cycle = 0; cycle <= 632; cycle++) {
      // Calculate decayed amounts
      xAllocationsAmount = await emissions.getXAllocationsAmount(START_TIME + cycle * CYCLE_DURATION)
      vote2EarnAmount = await emissions.getVote2EarnAmount(START_TIME + cycle * CYCLE_DURATION)
      treasuryAmount = await emissions.getTreasuryAmount(START_TIME + cycle * CYCLE_DURATION)

      // Log the cycle and amounts for debugging
      // Uncomment to view the emissions for each cycle
      /* console.log(
        `Cycle ${cycle}: XAllocations = ${ethers.formatEther(xAllocationsAmount)}, Vote2Earn = ${ethers.formatEther(vote2EarnAmount)}`,
        `Treasury = ${ethers.formatEther(treasuryAmount)}`,
      ) */

      // Assert the calculated amounts match the expected amounts from the spreadsheet
      expect(Math.floor(Number(ethers.formatEther(xAllocationsAmount)))).to.equal(
        Math.floor(Number(expectedXAllocationsAmounts[cycle][0])),
      )
      expect(Math.floor(Number(ethers.formatEther(vote2EarnAmount)))).to.equal(
        Math.floor(Number(expectedVote2EarnAmounts[cycle][0])),
      )
      expect(Math.floor(Number(ethers.formatEther(treasuryAmount)))).to.equal(
        Math.floor(Number(expectedTreasuryAmounts[cycle][0])),
      )
    }
  })

  it("Should not be able to distribute emissions if not minter", async () => {
    const { emissions, minterAccount } = await getOrDeployContractInstances({
      forceDeploy: true,
    })

    await catchRevert(emissions.connect(minterAccount).preMint())
  })
})
