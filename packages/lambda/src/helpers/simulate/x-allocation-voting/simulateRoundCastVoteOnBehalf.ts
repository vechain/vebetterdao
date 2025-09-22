import { getConfig } from "@repo/config"
import { distributeEmissions } from "../../../../../contracts/scripts/helpers/emissions"
import { ThorClient } from "@vechain/sdk-network"
import { getCurrentRoundId } from "../../xApps/getCurrentRoundId"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
import { getTestKeys, SeedStrategy, getSeedAccounts } from "../../../../../contracts/scripts/helpers/seedAccounts"
import { setupAccountsForVoting, waitForNextRound } from "./methods/setup"
import { castVoteOnBehalfOfMultiClauses, configureAutoVoting } from "./methods/auto-voting"
import { X2EarnApps__factory } from "../../../../../contracts/typechain-types"
import { ABIContract } from "@vechain/sdk-core"

const NUM_VOTERS = 10
const ACCT_OFFSET = 10
const SEED_STRATEGY = SeedStrategy.RANDOM

const simulateRound = async () => {
  const startTime = new Date().toISOString()
  console.log("╔════════════════════════════════════════════════════════════════╗")
  console.log("║                    ROUND SIMULATION STARTING                   ║")
  console.log("╚════════════════════════════════════════════════════════════════╝")
  console.log(`📅 Started at: ${startTime}`)
  console.log(`👥 Number of voters: ${NUM_VOTERS}`)
  console.log(`🎯 Account offset: ${ACCT_OFFSET}`)
  console.log(`🎲 Seed strategy: ${SEED_STRATEGY}`)

  const config = getConfig()
  const thorClient = ThorClient.at(config.nodeUrl)
  const accounts = getTestKeys(NUM_VOTERS + 1)
  const admin = accounts[0]

  console.log(`\n👑 Admin account: ${admin.address}`)
  console.log(`🌐 Network URL: ${config.nodeUrl}`)

  const seedAccounts = getSeedAccounts(SEED_STRATEGY, NUM_VOTERS, ACCT_OFFSET)
  console.log(`\n📋 Generated ${seedAccounts.length} seed accounts for testing`)

  console.log(`\n🔍 Fetching eligible apps...`)
  const allAppsResult = await thorClient.contracts.executeCall(
    config.x2EarnAppsContractAddress,
    ABIContract.ofAbi(X2EarnApps__factory.abi).getFunction("allEligibleApps"),
    [],
  )
  const appIds = allAppsResult.result?.array?.[0] as string[]
  console.log(`✅ Found ${appIds?.length || 0} eligible apps`)

  // Setup accounts with tokens and voting capabilities
  console.log("\n" + "═".repeat(70))
  console.log("🏗️  PHASE 1: ACCOUNT SETUP")
  console.log("═".repeat(70))
  await setupAccountsForVoting(thorClient, config, seedAccounts, accounts, admin)

  console.log("\n" + "═".repeat(70))
  console.log("⏳ PHASE 2: WAITING FOR FIRST ROUND")
  console.log("═".repeat(70))
  console.log("⏰ Waiting for next round to start...")
  await waitForNextRound(thorClient, config)
  console.log("🚀 Starting new emissions round...")
  await distributeEmissions(config.emissionsContractAddress, admin)

  // Configure auto-voting for each account
  await configureAutoVoting(thorClient, config, NUM_VOTERS, seedAccounts, appIds)

  // Wait for next round and start voting
  console.log("\n" + "═".repeat(70))
  console.log("🗳️  PHASE 3: ACTUAL VOTING ROUND")
  console.log("═".repeat(70))
  console.log("⏰ Waiting for next voting round to start...")
  await waitForNextRound(thorClient, config)

  console.log("🚀 Starting new emissions round for voting...")
  await distributeEmissions(config.emissionsContractAddress, admin)

  const currentRoundId = await getCurrentRoundId(thorClient, config.xAllocationVotingContractAddress)
  console.log(`🎯 Current round ID: ${currentRoundId}`)

  console.log(`\n📢 Casting votes on behalf of ${seedAccounts.length} users...`)
  const voteStartTime = new Date().toISOString()
  console.log(`⏰ Vote casting started at: ${voteStartTime}`)

  try {
    await castVoteOnBehalfOfMultiClauses(
      thorClient,
      config,
      seedAccounts.map(sa => sa.key),
      parseInt(currentRoundId as string),
      admin,
    )
    const voteEndTime = new Date().toISOString()
    console.log(`✅ Successfully cast votes for ${seedAccounts.length} accounts`)
    console.log(`⏰ Vote casting completed at: ${voteEndTime}`)
  } catch (error) {
    const errorTime = new Date().toISOString()
    console.log(`❌ Failed to cast votes at ${errorTime}`)
    console.log(`💥 Error details: ${error}`)
    throw error
  }

  const endTime = new Date().toISOString()
  console.log("\n╔════════════════════════════════════════════════════════════════╗")
  console.log("║                   ROUND SIMULATION COMPLETE                    ║")
  console.log("╚════════════════════════════════════════════════════════════════╝")
  console.log(`🏁 Completed at: ${endTime}`)
  console.log(`✨ All ${seedAccounts.length} accounts processed successfully`)
}

simulateRound()
