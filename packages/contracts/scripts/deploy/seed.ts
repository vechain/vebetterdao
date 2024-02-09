import { ethers } from "hardhat"
import { B3TR, Emissions, VOT3, XAllocationPool, XAllocationVoting } from "../../typechain-types"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

/**
 *  Mint $B3TR tokens and swap for VOT3 tokens
 */
const mintAndApproveB3tr = async (
  b3tr: B3TR,
  vot3: VOT3,
  amount: string = "1000",
  accounts: HardhatEthersSigner[],
  minterIndex = 1,
  accountsToSeed = 5,
) => {
  console.log(`Minting ${amount} and approving the B3TR contract...`)

  const minterAccount = accounts[minterIndex]

  const mintPromises = accounts.slice(0, accountsToSeed).map(async account => {
    return await b3tr
      .connect(minterAccount)
      .mint(account.address, ethers.parseEther(amount))
      .then(async tx => await tx.wait())
  })

  //   const approvePromises = accounts.slice(0, accountsToSeed).map(async account => {
  //     return await b3tr
  //       .connect(account)
  //       .approve(await vot3.getAddress(), ethers.parseEther(amount))
  //       .then(async tx => await tx.wait())
  //   })
  //   return await Promise.all([...mintPromises, ...approvePromises])
  return await Promise.all([...mintPromises])
}

const swapB3trForVot3 = async (
  vot3: VOT3,
  amount: string = "500",
  accounts: HardhatEthersSigner[],
  accountsToSeed = 5,
) => {
  console.log(`Swapping ${amount} $B3TR for VOT3...`)

  return await Promise.all(
    accounts.slice(0, accountsToSeed).map(async account => {
      return await vot3
        .connect(account)
        .stake(ethers.parseEther(amount.toString()))
        .then(async tx => await tx.wait())
    }),
  )
}

const addXDapps = async (xAllocationPool: XAllocationPool, accounts: HardhatEthersSigner[]) => {
  console.log("Adding x-apps...")
  const APPS = [
    {
      address: accounts[6].address,
      name: "Test app 1",
      metadata: "https://test-app-1.com",
      availableForAllocationVoting: true,
    },
    {
      address: accounts[7].address,
      name: "Test app 2",
      metadata: "https://test-app-2.com",
      availableForAllocationVoting: true,
    },
    {
      address: accounts[8].address,
      name: "Test app 3",
      metadata: "https://test-app-3.com",
      availableForAllocationVoting: true,
    },
  ]

  return await Promise.all(
    APPS.map(async app => {
      return await xAllocationPool
        .addApp(app.address, app.name, app.metadata, app.availableForAllocationVoting)
        .then(async tx => await tx.wait())
    }),
  )
}

const castVotesToXDapps = async (xAllocationPool: XAllocationPool, accounts: HardhatEthersSigner[]) => {
  console.log("Adding x-apps...")
  const APPS = [
    {
      address: accounts[6].address,
      name: "Test app 1",
      metadata: "https://test-app-1.com",
      availableForAllocationVoting: true,
    },
    {
      address: accounts[7].address,
      name: "Test app 2",
      metadata: "https://test-app-2.com",
      availableForAllocationVoting: true,
    },
    {
      address: accounts[8].address,
      name: "Test app 3",
      metadata: "https://test-app-3.com",
      availableForAllocationVoting: true,
    },
  ]

  return Promise.all(
    APPS.map(async app => {
      return await xAllocationPool
        .addApp(app.address, app.name, app.metadata, app.availableForAllocationVoting)
        .then(async tx => await tx.wait())
    }),
  )
}

export const seedLocalEnvironment = async (
  b3tr: B3TR,
  vot3: VOT3,
  xAllocationPool: XAllocationPool,
  xAllocationVoting: XAllocationVoting,
  emissions: Emissions,
) => {
  const start = performance.now()
  console.log("Seeding local environment")
  const accounts = await ethers.getSigners()

  // Mint $B3TR tokens to the first 5 accounts in the mnemonic
  const mintReceipts = await mintAndApproveB3tr(b3tr, vot3, "1000", accounts)
  const swapReceipts = await swapB3trForVot3(vot3, "500", accounts)
  // Add x-apps to the XAllocationPool
  const xDappsReceipts = await addXDapps(xAllocationPool, accounts)

  // Pre mint $B3TR
  console.log("Pre minting $B3TR...")
  await b3tr.grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress()).then(async tx => await tx.wait())
  await emissions
    .connect(accounts[1])
    .preMint()
    .then(async tx => await tx.wait())

  const smallVotingPeriod = 1000 * 10

  //   await xAllocationVoting.setVotingPeriod(smallVotingPeriod).then(async tx => await tx.wait())

  //   Start new allocation round
  console.log("Starting new allocation round...")
  await xAllocationVoting.proposeNewAllocationRound().then(async tx => await tx.wait())

  const end = performance.now()
  console.log(`Seeding complete in ${end - start}ms`)
}
