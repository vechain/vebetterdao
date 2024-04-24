import { Emissions, Treasury, X2EarnApps } from "../../typechain-types"
import { SeedStrategy, getAccounts, getSeedAccounts } from "../helpers/seedAccounts"
import { bootstrapEmissions } from "../helpers/emissions"
import { addXDapps } from "../helpers/xApp"
import { airdropB3trFromTreasury } from "../helpers/airdrop"

export const setupLocalEnvironment = async (emissions: Emissions, treasury: Treasury, x2EarnApps: X2EarnApps) => {
  const start = performance.now()
  console.log("Setup local environment")

  const accounts = getAccounts(12)

  const APPS = [
    {
      address: accounts[6].address,
      name: "Vyvo",
      metadataURI: "bafkreigk7faih4jmdee4ritah6564jqpfn5s2gl4dcsvii7woijy5ls7ca",
    },
    {
      address: accounts[7].address,
      name: "Mugshot",
      metadataURI: "bafkreicglvjxjy2yxruwpmu6czm5th76bauu5phfhnlf2oxbyc66fdrzkm",
    },
    {
      address: accounts[9].address,
      name: "Cleanify",
      metadataURI: "bafkreicw6g34t3th63z7hq3o4xkay6dkrei5ny5evyrlclw53gfz6o6lgu",
    },
    {
      address: accounts[10].address,
      name: "Non Fungible Book Club (NFBC)",
      metadataURI: "bafkreicdcol6afcsfb4efxmjzqsuonukn54jixmfqmfsirhw4wujvxfpxy",
    },
    {
      address: accounts[11].address,
      name: "Green Ambassador Challenge",
      metadataURI: "bafkreigrwjowwwcmdd7bdm3yqsquu77ufeqcao6mjbd2fednwo5qfmtldi",
    },
  ]

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

  const end = performance.now()
  console.log(`Setup complete in ${end - start}ms`)
}

export const setupTestEnvironment = async (emissions: Emissions, x2EarnApps: X2EarnApps) => {
  console.log("Setup Testnet environment:")
  const start = performance.now()

  const accounts = getAccounts(10)
  const admin = accounts[0]

  // Bootstrap emissions
  const emissionsContract = await emissions.getAddress()
  await bootstrapEmissions(emissionsContract, admin)

  //   Add x-apps to the XAllocationPool
  console.log("Adding x-apps...")
  const APPS = [
    {
      address: "0x61fFC950b04090f5CE857ebF056852a6D27b0c3c",
      name: "Vyvo",
      metadataURI: "bafkreigk7faih4jmdee4ritah6564jqpfn5s2gl4dcsvii7woijy5ls7ca",
    },
    {
      address: "0xbfE2122a82C0AEa091514f57C7713C3118101eDa",
      name: "Mugshot",
      metadataURI: "bafkreicw6g34t3th63z7hq3o4xkay6dkrei5ny5evyrlclw53gfz6o6lgu",
    },
    {
      address: "0x6B020E5C8E8574388a275cC498B27E3EB91ec3f2",
      name: "Cleanify",
      metadataURI: "bafkreicglvjxjy2yxruwpmu6czm5th76bauu5phfhnlf2oxbyc66fdrzkm",
    },
  ]

  // Add x-apps to the XAllocationPool
  const x2EarnAppsAddress = await x2EarnApps.getAddress()
  await addXDapps(x2EarnAppsAddress, admin, APPS)

  const end = performance.now()
  console.log(`Setup complete in ${end - start}ms`)
}
