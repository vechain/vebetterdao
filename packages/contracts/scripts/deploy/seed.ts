import { ethers } from "hardhat"
import { B3TR, Emissions, VOT3, XAllocationVoting, XApps } from "../../typechain-types"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { BytesLike } from "ethers"

type App = {
  address: string
  name: string
}
const getApps = (accounts: HardhatEthersSigner[]): App[] => [
  {
    address: accounts[6].address,
    name: "Vyvo",
  },
  {
    address: accounts[7].address,
    name: "Mugshot",
  },
  {
    address: accounts[9].address,
    name: "Cleanify",
  },
  {
    address: accounts[9].address,
    name: "Non Fungible Book Club (NFBC)",
  },
  {
    address: accounts[9].address,
    name: "Green Ambassador Challenge",
  },
  {
    address: accounts[9].address,
    name: "GreenCart",
  },
]

export const seedLocalEnvironment = async (
  b3tr: B3TR,
  vot3: VOT3,
  xAllocationVoting: XAllocationVoting,
  emissions: Emissions,
) => {
  const start = performance.now()
  console.log("Seeding local environment")
  const accounts = await ethers.getSigners()

  // Bootstrap emissions
  console.log("Bootstrapping emissions...")
  const admin = accounts[0]
  await emissions
    .connect(admin)
    .bootstrap()
    .then(async tx => await tx.wait())

  //Airdrop B3TR from Treasury to the first 5 accounts
  console.log("Airdropping B3TR from Treasury...")
  const accountsToSeed = accounts.slice(0, 5)
  const treasury = accounts[2]
  for (const account of accountsToSeed) {
    const tx = await b3tr.connect(treasury).transfer(account.address, ethers.parseEther("500"))
    await tx.wait()
  }

  //   Add x-apps to the XAllocationPool
  await addXDapps(xAllocationVoting, accountsToSeed, getApps(accounts))

  // const xDappsFromContract = await xAllocationVoting.getAllApps()

  // await emissions
  //   .connect(admin)
  //   .start()
  //   .then(async tx => await tx.wait())

  // Start new allocation round
  // const roundId = parseInt((await xAllocationVoting.currentRoundId()).toString())
  // console.log("Casting random votes to xDapps...")
  // await castVotesToXDapps(xAllocationVoting, accountsToSeed, roundId, amountToSwap, xDappsFromContract)

  //TODO: SEED multiple rounds and votes (we need to execute a proposal to change the votingPeriod to someseconds)
  // await waitForRoundToEnd(roundId, xAllocationVoting)

  // for (let i = 0; i < 15; i++) {
  //   await emissions.distribute()
  //   const roundId = parseInt((await xAllocationVoting.currentRoundId()).toString())
  //   console.log(`Casting random votes to xDapps for round ${roundId}...`)
  //   await castVotesToXDapps(xAllocationVoting, accountsToSeed, roundId, amountToSwap, xDappsFromContract)
  //   await waitForRoundToEnd(roundId, xAllocationVoting)
  // }

  const end = performance.now()
  console.log(`Seeding complete in ${end - start}ms`)
}

export const seedTestEnvironment = async (b3tr: B3TR, xAllocationVoting: XAllocationVoting, emissions: Emissions) => {
  console.log("Seeding Testnet environment:")
  const start = performance.now()

  const accounts = await ethers.getSigners()
  const admin = accounts[0]

  // Bootstrap emissions
  console.log("Bootstrapping emissions...")

  await emissions
    .connect(admin)
    .bootstrap()
    .then(async tx => await tx.wait())

  //   Add x-apps to the XAllocationPool
  console.log("Adding x-apps...")
  const apps = getApps(accounts)

  for (const app of apps) {
    await xAllocationVoting
      .connect(admin)
      .addApp(app.address, app.name)
      .then(async tx => await tx.wait())
  }

  const end = performance.now()
  console.log(`Seeding complete in ${end - start}ms`)
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

  // Avoid promise.all so we can decide the order of the apps
  for (const app of apps) {
    await xAllocationVoting
      .connect(accounts[0])
      .addApp(app.address, app.name)
      .then(async tx => await tx.wait())
  }
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
          { gasLimit: 10_000_000 },
        )
        .then(async tx => await tx.wait())
    }),
  )
}
