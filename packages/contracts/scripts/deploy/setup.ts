import { Emissions, Treasury, X2EarnApps } from "../../typechain-types"
import { SeedStrategy, getSeedAccounts, getTestKeys } from "../helpers/seedAccounts"
import { bootstrapEmissions } from "../helpers/emissions"
import { addXDapps } from "../helpers/xApp"
import { airdropB3trFromTreasury } from "../helpers/airdrop"

const accounts = getTestKeys(13)

const APPS = [
  {
    admin: accounts[6].address,
    teamWalletAddress: accounts[6].address,
    name: "Mugshot",
    metadataURI: "bafkreih6y5pq5cq4q3fe6apr46ccwho7s7wga2zrwjxdkf2cdohgaexaey",
  },
  {
    admin: accounts[6].address,
    teamWalletAddress: accounts[6].address,
    name: "Cleanify",
    metadataURI: "bafkreicw6g34t3th63z7hq3o4xkay6dkrei5ny5evyrlclw53gfz6o6lgu",
  },
  {
    admin: accounts[6].address,
    teamWalletAddress: accounts[6].address,
    name: "GreenCart",
    metadataURI: "bafkreihw2ugdn6roakmyg3xt4opbt2knitoc32skp3gt2iuvgkqksk2jla",
  },
  {
    admin: accounts[6].address,
    teamWalletAddress: accounts[6].address,
    name: "Green Ambassador Challenge",
    metadataURI: "bafkreigrwjowwwcmdd7bdm3yqsquu77ufeqcao6mjbd2fednwo5qfmtldi",
  },
  {
    admin: accounts[6].address,
    teamWalletAddress: accounts[6].address,
    name: "Oily",
    metadataURI: "bafkreifdcybquzd2dligett53f7zd2lt642jjkiij5gs3c3vukpdlwwdly",
  },
  {
    admin: accounts[6].address,
    teamWalletAddress: accounts[6].address,
    name: "EVearn",
    metadataURI: "bafkreif5m23ikv6jphvjciv5uwtq3eqchinh5m5jexdo7atgxyf62az65y",
  },
  {
    admin: accounts[6].address,
    teamWalletAddress: accounts[6].address,
    name: "Vyvo",
    metadataURI: "bafkreigk7faih4jmdee4ritah6564jqpfn5s2gl4dcsvii7woijy5ls7ca",
  },
  {
    admin: accounts[6].address,
    teamWalletAddress: accounts[6].address,
    name: "Non Fungible Book Club (NFBC)",
    metadataURI: "bafkreicdcol6afcsfb4efxmjzqsuonukn54jixmfqmfsirhw4wujvxfpxy",
  },
]

export const setupLocalEnvironment = async (emissions: Emissions, treasury: Treasury, x2EarnApps: X2EarnApps) => {
  const start = performance.now()
  console.log("================ Setup local environment")

  // Define specific accounts
  const admin = accounts[0]

  // Bootstrap emissions
  const emissionsContract = await emissions.getAddress()
  await bootstrapEmissions(emissionsContract, admin)

  // Add x-apps to the XAllocationPool
  const x2EarnAppsAddress = await x2EarnApps.getAddress()
  await addXDapps(x2EarnAppsAddress, admin, APPS)

  // Seed the first 5 accounts with some tokens
  const treasuryAddress = await treasury.getAddress()
  const seedAccounts = getSeedAccounts(SeedStrategy.FIXED, 5, 0)
  await airdropB3trFromTreasury(treasuryAddress, admin, seedAccounts)

  const end = new Date(performance.now() - start)
  console.log(`Setup complete in ${end.getMinutes()}m ${end.getSeconds()}s`)
}

export const setupTestEnvironment = async (emissions: Emissions, x2EarnApps: X2EarnApps) => {
  console.log("================ Setup Testnet environment")
  const start = performance.now()

  const admin = accounts[0]

  // Bootstrap emissions
  const emissionsContract = await emissions.getAddress()
  await bootstrapEmissions(emissionsContract, admin)

  // Add x-apps to the XAllocationPool
  console.log("Adding x-apps...")

  // Add x-apps to the XAllocationPool
  const x2EarnAppsAddress = await x2EarnApps.getAddress()
  await addXDapps(x2EarnAppsAddress, admin, APPS)
  console.log("x-apps added")

  const end = performance.now()
  console.log(`Setup complete in ${end - start}ms`)
}

export const setupMainnetEnvironment = async (emissions: Emissions, x2EarnApps: X2EarnApps) => {
  console.log("================ Setup Mainnet environment")
  const start = performance.now()

  const mainnet_admin_addresses = new Map([
    ["Mugshot", "0xbfe2122a82c0aea091514f57c7713c3118101eda"],
    ["Cleanify", "0x6b020e5c8e8574388a275cc498b27e3eb91ec3f2"],
    ["GreenCart", "0x4e506ee842ba8ccce88e424522506f5b860e5c9b"],
    ["Green Ambassador Challenge", "0x15e74aeb00d367a5a20c61b469df30a25f0e602f"],
    ["Oily", "0xd52e3356231c9fa86bb9fab731f8c0c3f1018753"],
    ["EVearn", "0xb2919e12d035a484f8414643b606b2a180224f54"],
    ["Vyvo", "0x61ffc950b04090f5ce857ebf056852a6d27b0c3c"],
    ["Non Fungible Book Club (NFBC)", "0xbe50d2fae95b23082f351e290548365e84ec1780"],
  ])

  const admin = accounts[0]

  // Bootstrap emissions
  const emissionsContract = await emissions.getAddress()
  await bootstrapEmissions(emissionsContract, admin)

  // Add x-apps to the XAllocationPool
  console.log("Adding x-apps...")

  // Add x-apps to the XAllocationPool
  const x2EarnAppsAddress = await x2EarnApps.getAddress()

  // Overwrite the admin and teamWalletAddress with the mainnet addresses
  APPS.forEach(app => {
    const newAddress = mainnet_admin_addresses.get(app.name)
    if (newAddress) {
      app.admin = newAddress
      app.teamWalletAddress = newAddress
    } else {
      throw new Error(`Mainnet admin address not found for ${app.name}`)
    }

    console.log(app.name)
    console.log("Admin: ", app.admin)
    console.log("Team Wallet Address: ", app.teamWalletAddress)
  })

  await addXDapps(x2EarnAppsAddress, admin, APPS)
  console.log("x-apps added")

  const end = performance.now()
  console.log(`Setup complete in ${end - start}ms`)
}
