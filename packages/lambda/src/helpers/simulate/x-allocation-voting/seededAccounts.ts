import path from "path"
import dotenv from "dotenv"
import fs from "fs"
import { getConfig } from "@repo/config"
import { ThorClient } from "@vechain/sdk-network"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
import { getSeedAccounts, SeedStrategy, TestPk } from "../../../../../contracts/scripts/helpers/seedAccounts"
import { setupAccountsForVoting } from "./methods/setup"

export interface SerializableAccount {
  address: string
  amount: string
  vot3Balance?: string
  setupCompleted?: boolean
  lastSetupDate?: string
}

export interface SeededAccountsData {
  accounts: SerializableAccount[]
  metadata: {
    numVoters: number
    acctOffset: number
    seedStrategy: SeedStrategy
    generatedAt: string
    lastSetupDate?: string
    setupCompleted?: boolean
  }
}

export interface SeededAccountsResult {
  accounts: { key: TestPk; amount: bigint }[]
  isGenerated: boolean
}

/**
 * Generates seeded accounts and saves them to JSON file for reuse
 */
export const generateAndSaveSeededAccounts = async (
  numVoters: number = 10,
  acctOffset: number = 10,
  seedStrategy: SeedStrategy = SeedStrategy.RANDOM,
  performSetup: boolean = true,
): Promise<SeededAccountsData> => {
  console.log(
    `🏗️  Generating ${numVoters} seeded accounts (strategy: ${SeedStrategy[seedStrategy]}, setup: ${performSetup})`,
  )

  const seedAccounts = getSeedAccounts(seedStrategy, numVoters, acctOffset)
  let finalAccounts: SerializableAccount[]

  if (performSetup) {
    const { getTestKeys } = require("../../../../../contracts/scripts/helpers/seedAccounts")
    const testAccounts = getTestKeys(numVoters + acctOffset + 1)
    const admin = testAccounts[0]
    const config = getConfig()
    const thorClient = ThorClient.at(config.nodeUrl)

    console.log("🚀 Starting account setup (whitelist, airdrop, VOT3 conversion)...")
    finalAccounts = await setupAccountsForVoting(thorClient, config, seedAccounts, admin, testAccounts)
  } else {
    finalAccounts = seedAccounts.map(account => ({
      address: account.key.address.toString(),
      amount: account.amount.toString(),
      setupCompleted: false,
    }))
  }

  const data: SeededAccountsData = {
    accounts: finalAccounts,
    metadata: {
      numVoters,
      acctOffset,
      seedStrategy,
      generatedAt: new Date().toISOString(),
      lastSetupDate: performSetup ? new Date().toISOString() : undefined,
      setupCompleted: performSetup,
    },
  }

  // Save to JSON file
  const dataDir = path.join(__dirname, "data")
  const jsonPath = path.join(dataDir, "seededAccounts.json")

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2))

  // Essential summary only
  if (performSetup) {
    const setupCount = finalAccounts.filter(acc => acc.setupCompleted).length
    const accountsWithVot3 = finalAccounts.filter(acc => acc.vot3Balance && BigInt(acc.vot3Balance) > 0n).length
    const totalVot3 = finalAccounts.reduce((sum, acc) => sum + BigInt(acc.vot3Balance || "0"), 0n)

    console.log(
      `✅ Setup complete: ${setupCount}/${finalAccounts.length} accounts ready, ${accountsWithVot3} with voting power`,
    )
    console.log(`💰 Total VOT3: ${totalVot3.toString()}`)
  } else {
    console.log(`✅ Generated ${finalAccounts.length} accounts (no setup performed)`)
  }

  return data
}

/**
 * Loads seeded accounts from JSON file
 */
export const loadSeededAccountsFromFile = (): SeededAccountsData | null => {
  const jsonPath = path.join(__dirname, "data", "seededAccounts.json")

  if (!fs.existsSync(jsonPath)) {
    return null
  }

  try {
    const fileContent = fs.readFileSync(jsonPath, "utf8")
    const data: SeededAccountsData = JSON.parse(fileContent)

    console.log(`📥 Loaded ${data.accounts.length} accounts from file`)
    return data
  } catch (error) {
    console.error(`❌ Failed to load accounts: ${error}`)
    return null
  }
}

/**
 * Converts loaded seeded accounts back to TestPk format for use in simulation
 */
export const convertToTestPkAccounts = (data: SeededAccountsData): { key: TestPk; amount: bigint }[] => {
  const { getTestKeys } = require("../../../../../contracts/scripts/helpers/seedAccounts")
  const { numVoters, acctOffset } = data.metadata
  const testKeys = getTestKeys(numVoters + acctOffset)

  return data.accounts.map((account, index) => {
    const testKey = testKeys[acctOffset + index]
    return {
      key: testKey,
      amount: BigInt(account.amount),
    }
  })
}

/**
 * Main function to either load existing seeded accounts or generate new ones
 * Returns both the accounts and a boolean indicating if they were newly generated
 */
export const getOrCreateSeededAccounts = async (
  numVoters: number = 10,
  acctOffset: number = 10,
  seedStrategy: SeedStrategy = SeedStrategy.RANDOM,
  forceRegenerate: boolean = false,
): Promise<SeededAccountsResult> => {
  if (!forceRegenerate) {
    const existingData = loadSeededAccountsFromFile()
    if (
      existingData &&
      existingData.metadata.numVoters === numVoters &&
      existingData.metadata.acctOffset === acctOffset &&
      existingData.metadata.seedStrategy === seedStrategy
    ) {
      console.log("♻️  Using existing accounts")
      return {
        accounts: convertToTestPkAccounts(existingData),
        isGenerated: false,
      }
    }
  }

  console.log("🔄 Generating new accounts...")
  const newData = await generateAndSaveSeededAccounts(numVoters, acctOffset, seedStrategy)
  return {
    accounts: convertToTestPkAccounts(newData),
    isGenerated: true,
  }
}

// Export for standalone usage
if (require.main === module) {
  const main = async () => {
    try {
      const NUM_VOTERS = 5
      const ACCT_OFFSET = 5
      const SEED_STRATEGY = SeedStrategy.FIXED

      await generateAndSaveSeededAccounts(NUM_VOTERS, ACCT_OFFSET, SEED_STRATEGY)
    } catch (error) {
      console.error("❌ Failed:", error)
      process.exit(1)
    }
  }

  main()
}
