import { ethers } from "hardhat"
import { B3TR, Emissions, VOT3, XAllocationVoting, XApps } from "../../typechain-types"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { BytesLike } from "ethers"
import { waitForProposalToBeActive } from "../../test/helpers"

type App = {
  address: string
  name: string
  metadata: string
}
/**
 *  Mint $B3TR tokens and swap for VOT3 tokens
 */
const mintAndApproveB3tr = async (
  b3tr: B3TR,
  vot3: VOT3,
  amount: string = "1000",
  accounts: HardhatEthersSigner[],
  minterAccount: HardhatEthersSigner,
) => {
  console.log(`Minting ${amount} and approving the B3TR contract...`)

  const mintPromises = accounts.map(async account => {
    return await b3tr
      .connect(minterAccount)
      .mint(account.address, ethers.parseEther(amount))
      .then(async tx => await tx.wait())
  })

  const approvePromises = accounts.map(async account => {
    return await b3tr
      .connect(account)
      .approve(await vot3.getAddress(), ethers.parseEther(amount))
      .then(async tx => await tx.wait())
  })
  return await Promise.all([...mintPromises, ...approvePromises])
}

const swapB3trForVot3 = async (vot3: VOT3, amount: string = "500", accounts: HardhatEthersSigner[]) => {
  console.log(`Swapping ${amount} $B3TR for VOT3...`)

  return await Promise.all(
    accounts.map(async account => {
      return await vot3
        .connect(account)
        .stake(ethers.parseEther(amount))
        .then(async tx => await tx.wait())
    }),
  )
}

const addXDapps = async (xAllocationVoting: XAllocationVoting, accounts: HardhatEthersSigner[], apps: App[]) => {
  console.log("Adding x-apps...")

  return await Promise.all(
    apps.map(async app => {
      return await xAllocationVoting
        .connect(accounts[0])
        .addApp(app.address, app.name, app.metadata)
        .then(async tx => await tx.wait())
    }),
  )
}

const castVotesToXDapps = async (
  xAllocationVoting: XAllocationVoting,
  accounts: HardhatEthersSigner[],
  roundId: number,
  vot3mount: string,
  apps: XApps.AppStruct[],
) => {
  return Promise.all(
    accounts.map(async account => {
      //split my 500 to the apps . The amount should be random, we may not want to split it evenly

      let residual = BigInt(vot3mount)
      const splits: { app: BytesLike; weight: string }[] = []

      // eslint-disable-next-line no-unused-vars
      let randomDappsToVote = apps.filter(_ => Math.floor(Math.random() * 2) == 0)
      if (!randomDappsToVote.length) randomDappsToVote = apps

      console.log(`Casting random votes to ${randomDappsToVote.length} xDapps...`)
      for (const [index, app] of randomDappsToVote.entries()) {
        let vote = BigInt(0)
        if (index === randomDappsToVote.length - 1) {
          vote = residual
        } else {
          vote = BigInt(Math.floor(Math.random() * Number(residual)))
          residual = residual - vote
        }
        splits.push({ app: app.id, weight: vote.toString() })
      }

      return await xAllocationVoting
        .connect(account)
        .castVote(
          roundId,
          splits.map(split => split.app),
          splits.map(split => ethers.parseEther(split.weight)),
        )
        .then(async tx => await tx.wait())
    }),
  )
}

export const seedLocalEnvironment = async (
  b3tr: B3TR,
  vot3: VOT3,
  xAllocationVoting: XAllocationVoting,
  emissions: Emissions,
) => {
  const start = performance.now()
  console.log("Seeding local environment")
  const accounts = await ethers.getSigners()

  const amountToMint = "1000"
  const amountToSwap = (Number(amountToMint) / 2).toString()

  const accountsToSeed = accounts.slice(0, 5)
  const minterAccount = accounts[1]
  // Mint $B3TR tokens to the first 5 accounts in the mnemonic
  await mintAndApproveB3tr(b3tr, vot3, amountToMint, accountsToSeed, minterAccount)
  await swapB3trForVot3(vot3, amountToSwap, accountsToSeed)

  const APPS: App[] = [
    {
      address: accounts[6].address,
      name: "Test app 1",
      metadata: "https://test-app-1.com",
    },
    {
      address: accounts[7].address,
      name: "Test app 2",
      metadata: "https://test-app-2.com",
    },
    {
      address: accounts[8].address,
      name: "Test app 3",
      metadata: "https://test-app-3.com",
    },
  ]

  //   Add x-apps to the XAllocationPool
  await addXDapps(xAllocationVoting, accountsToSeed, APPS)

  const xDappsFromContract = await xAllocationVoting.getAllApps()

  //   Pre mint $B3TR
  console.log("Pre minting $B3TR...")
  await b3tr.grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress()).then(async tx => await tx.wait())
  await emissions
    .connect(accounts[1])
    .preMint()
    .then(async tx => await tx.wait())

  //   Start new allocation round
  const roundId = parseInt((await xAllocationVoting.currentRoundId()).toString())
  console.log("Casting random votes to xDapps...")
  await castVotesToXDapps(xAllocationVoting, accountsToSeed, roundId, amountToSwap, xDappsFromContract)

  //TODO: SEED multiple rounds and votes (we need to execute a proposal to change the votingPeriod to someseconds)

  const end = performance.now()
  console.log(`Seeding complete in ${end - start}ms`)
}
