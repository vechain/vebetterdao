import { ethers } from "hardhat"
import { B3TR, Emissions, XAllocationPool, XAllocationVoting } from "../../typechain-types"

export const seedLocalEnvironmnet = async (
  b3tr: B3TR,
  xAllocationPool: XAllocationPool,
  xAllocationVoting: XAllocationVoting,
  emissions: Emissions,
) => {
  console.log("Seeding local environment")
  const accounts = await ethers.getSigners()

  // Mint $B3TR tockens to the first 5 accounts in the mnemonic
  console.log("Minting $B3TR...")
  for (let i = 0; i < 5; i++) {
    await b3tr
      .connect(accounts[1])
      .mint(accounts[i].address, ethers.parseEther("1000"))
      .then(async tx => await tx.wait())
  }

  // Add x-apps to the XAllocationPool
  console.log("Adding x-apps...")
  await xAllocationPool
    .addApp(accounts[6], "Test app 1", "https://test-app-1.com", true)
    .then(async tx => await tx.wait())

  await xAllocationPool
    .addApp(accounts[7], "Test app 2", "https://test-app-1.com", true)
    .then(async tx => await tx.wait())
  await xAllocationPool
    .addApp(accounts[8], "Test app 3", "https://test-app-1.com", true)
    .then(async tx => await tx.wait())

  // Pre mint $B3TR
  console.log("Pre minting $B3TR...")
  await b3tr.grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress()).then(async tx => await tx.wait())
  await emissions
    .connect(accounts[1])
    .preMint()
    .then(async tx => await tx.wait())

  await xAllocationVoting.setVotingPeriod(1000 * 10).then(async tx => await tx.wait())

  //   Start new allocation round
  console.log("Starting new allocation round...")
  await xAllocationVoting.proposeNewAllocationRound().then(async tx => await tx.wait())

  console.log("Seeding completed")
}
