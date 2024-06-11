import { B3TR, Emissions, XAllocationVoting } from "../../typechain-types"
import { SeedStrategy, getTestKeys, getSeedAccounts } from "../helpers/seedAccounts"
import { bootstrapEmissions } from "../helpers/emissions"
import { App, addXDapps } from "../helpers/xApp"
import { airdropB3tr } from "../helpers/airdrop"

export const setupLocalEnvironment = async (b3tr: B3TR, xAllocationVoting: XAllocationVoting, emissions: Emissions) => {
  const start = performance.now()
  console.log("Setup local environment")
  const accounts = getTestKeys(14)

  // Define specific accounts
  const admin = accounts[0]
  const treasury = accounts[2]

  // Apps
  const APPS: App[] = [
    {
      address: accounts[6].address,
      name: "Vyvo",
    },
    {
      address: accounts[6].address,
      name: "Mugshot",
    },
    {
      address: accounts[6].address,
      name: "Cleanify",
    },
    {
      address: accounts[6].address,
      name: "Non Fungible Book Club (NFBC)",
    },
    {
      address: accounts[6].address,
      name: "Green Ambassador Challenge",
    },
    {
      address: accounts[6].address,
      name: "GreenCart",
    },
    {
      address: accounts[6].address,
      name: "EVearn",
    },
    {
      address: accounts[6].address,
      name: "Oily",
    },
  ]

  // Bootstrap emissions
  const emissionsContract = await emissions.getAddress()
  await bootstrapEmissions(emissionsContract, admin)

  // Add x-apps to the XAllocationPool
  const xAllocAddress = await xAllocationVoting.getAddress()
  await addXDapps(xAllocAddress, admin, APPS)

  // Seed the first 5 accounts with some tokens
  const seedAccounts = getSeedAccounts(SeedStrategy.FIXED, 5, 0)
  await airdropB3tr(treasury, await b3tr.getAddress(), seedAccounts)

  const end = performance.now()
  console.log(`Setup complete in ${end - start}ms`)
}

export const setupTestEnvironment = async (xAllocationVoting: XAllocationVoting, emissions: Emissions) => {
  console.log("Setup Testnet environment:")
  const start = performance.now()

  const accounts = getTestKeys(10)
  const admin = accounts[0]

  // Bootstrap emissions
  console.log("Bootstrapping emissions...")

  const emissionsContract = await emissions.getAddress()
  await bootstrapEmissions(emissionsContract, admin)

  //   Add x-apps to the XAllocationPool
  console.log("Adding x-apps...")
  const APPS: App[] = [
    {
      address: "0x61fFC950b04090f5CE857ebF056852a6D27b0c3c",
      name: "Vyvo",
    },
    {
      address: "0xbfE2122a82C0AEa091514f57C7713C3118101eDa",
      name: "Mugshot",
    },
    {
      address: "0x6B020E5C8E8574388a275cC498B27E3EB91ec3f2",
      name: "Cleanify",
    },
  ]

  // Add x-apps to the XAllocationPool
  const xAllocAddress = await xAllocationVoting.getAddress()
  await addXDapps(xAllocAddress, admin, APPS)

  const end = performance.now()
  console.log(`Setup complete in ${end - start}ms`)
}
