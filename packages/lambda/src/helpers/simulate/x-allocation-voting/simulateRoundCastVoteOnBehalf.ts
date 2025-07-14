import { getConfig } from "@repo/config"
import { distributeEmissions } from "@repo/contracts/scripts/helpers/emissions"
import { ThorClient } from "@vechain/sdk-network"
import { getCurrentRoundId } from "../../xApps/getCurrentRoundId"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
import { getTestKeys, SeedStrategy, getSeedAccounts } from "@repo/contracts/scripts/helpers/seedAccounts"
import { setupAccountsForVoting, waitForNextRound } from "./methods/setup"
import { castVoteOnBehalfOfMultiClauses, configureAutoVoting } from "./methods/auto-voting"

const NUM_VOTERS = 10
const ACCT_OFFSET = 100
const SEED_STRATEGY = SeedStrategy.RANDOM

const simulateRound = async () => {
  console.log("=== Starting Round Simulation ===")

  const config = getConfig()
  const thorClient = ThorClient.at(config.nodeUrl)
  const accounts = getTestKeys(NUM_VOTERS + 1)
  const admin = accounts[0]
  const seedAccounts = getSeedAccounts(SEED_STRATEGY, NUM_VOTERS, ACCT_OFFSET)
  const mugshotAppId = "0x2fc30c2ad41a2994061efaf218f1d52dc92bc4a31a0f02a4916490076a7a393a" // Mugshot Hardcoded

  // Setup accounts with tokens and voting capabilities
  await setupAccountsForVoting(thorClient, config, seedAccounts, accounts, admin)

  // Configure auto-voting for each account
  await configureAutoVoting(thorClient, config, NUM_VOTERS, seedAccounts, [mugshotAppId])

  // Wait for next round and start voting
  console.log("\n=== Starting voting round ===")
  console.log("Waiting for next round to start...")
  await waitForNextRound(thorClient, config)

  console.log("1. Starting new round...")
  await distributeEmissions(config.emissionsContractAddress, admin)

  const currentRoundId = await getCurrentRoundId(thorClient, config.xAllocationVotingContractAddress)
  console.log(`Using round ID: ${currentRoundId}`)

  console.log("2. Casting votes on behalf of users...")
  try {
    await castVoteOnBehalfOfMultiClauses(
      thorClient,
      config,
      seedAccounts.map(sa => sa.key),
      parseInt(currentRoundId),
      admin,
    )
    console.log(`Successfully cast votes for ${seedAccounts.length} accounts`)
  } catch (error) {
    console.log(`Failed to cast votes: ${error}`)
  }

  console.log("\n=== Round Simulation Complete ===")
}

simulateRound()
