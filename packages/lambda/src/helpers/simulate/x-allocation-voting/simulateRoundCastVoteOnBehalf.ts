import { getConfig } from "@repo/config"
import { distributeEmissions } from "../../../../../contracts/scripts/helpers/emissions"
import { ThorClient } from "@vechain/sdk-network"
import { getCurrentRoundId } from "../../xApps/getCurrentRoundId"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
import { getTestKeys, SeedStrategy } from "../../../../../contracts/scripts/helpers/seedAccounts"
import { castVoteOnBehalfOfMultiClauses, claimRewardForUser, configureAutoVoting } from "./methods/auto-voting"
import { getOrCreateSeededAccounts } from "./seededAccounts"
import { getAllEligibleApps, waitForRoundStart } from "../.."
import { isRegisteredRelayer, registerRelayer } from "./methods/relayers"

const ACCT_OFFSET = 5 // Leave the first 5 accounts for admin, relayers, etc.
const NUM_VOTERS = 5
const SEED_STRATEGY = SeedStrategy.FIXED // All seeded accounts have 500 VOT3

const simulateRound = async () => {
  console.log("🚀 Starting round simulation for auto-voting: cast and claim rewards on behalf of users")
  console.log(`📊 Config: ${NUM_VOTERS} voters, offset ${ACCT_OFFSET}, strategy ${SeedStrategy[SEED_STRATEGY]}`)

  const config = getConfig()
  const thorClient = ThorClient.at(config.nodeUrl)
  const accounts = getTestKeys(NUM_VOTERS + 1) // 5 voters + 1 admin
  const defaultAdmin = accounts[0]
  const relayer = accounts[1]

  const isRegistered = await isRegisteredRelayer(thorClient, config, relayer)
  if (!isRegistered) {
    console.log("Relayer not registered, registering:", relayer.address.toString())
    await registerRelayer(thorClient, config, relayer, defaultAdmin)
  } else {
    console.log("Relayer already registered: ", relayer.address.toString())
  }

  const { accounts: seedAccounts, isGenerated } = await getOrCreateSeededAccounts(
    NUM_VOTERS,
    ACCT_OFFSET,
    SEED_STRATEGY,
  )
  console.log(
    `📋 Using ${seedAccounts.length} seeded accounts (${isGenerated ? "newly generated" : "reused from file"})`,
  )

  // If the accounts are newly generated, we need to start a new round in order to snapshot voting power
  if (isGenerated) {
    console.log("⏳ Starting a new round (in order to snapshot voting power)")
    await waitForRoundStart(thorClient, config)
    await distributeEmissions(config.emissionsContractAddress, defaultAdmin)
  }

  const appIds = await getAllEligibleApps(thorClient, config)
  if (!appIds || appIds.length === 0) {
    throw new Error("No eligible apps found")
  }
  console.log(`📱 Found ${appIds?.length || 0} eligible apps`)

  console.log("🤖 Phase 1: Configuring auto-voting")
  await configureAutoVoting(thorClient, config, NUM_VOTERS, seedAccounts, appIds)

  console.log("🗳️  Phase 2: Starting a new round")
  await waitForRoundStart(thorClient, config)
  await distributeEmissions(config.emissionsContractAddress, defaultAdmin)

  const currentRoundId = await getCurrentRoundId(thorClient, config.xAllocationVotingContractAddress)
  console.log(`🎯 Round ID: ${currentRoundId}`)

  console.log(`🤖 Phase 3: Casting votes for ${seedAccounts.length} accounts...`)
  try {
    await castVoteOnBehalfOfMultiClauses(
      thorClient,
      config,
      seedAccounts.map(sa => sa.key),
      parseInt(currentRoundId as string),
      relayer,
    )
    console.log(`✅ Successfully cast votes for all ${seedAccounts.length} accounts`)
  } catch (error) {
    console.log(`❌ Failed to cast votes: ${error}`)
    throw error
  }

  console.log(`Waiting for the ${currentRoundId} round to end...`)
  await waitForRoundStart(thorClient, config)
  await distributeEmissions(config.emissionsContractAddress, defaultAdmin)

  console.log(`🤖 Phase 4: Claiming rewards for ${seedAccounts.length} accounts...)`)
  for (const seedAccount of seedAccounts) {
    await claimRewardForUser(thorClient, config, seedAccount.key, relayer, parseInt(currentRoundId as string))
    console.log(`✅ Successfully claimed reward for ${seedAccount.key.address.toString()}`)
  }

  console.log("🎉 Round simulation complete")
}

simulateRound()
