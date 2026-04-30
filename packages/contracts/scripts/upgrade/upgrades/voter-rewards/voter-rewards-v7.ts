import { getConfig } from "@repo/config"
import { getContractsConfig } from "@repo/config/contracts"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { VoterRewards } from "../../../../typechain-types"
import { ethers } from "hardhat"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const envConfig = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const config = getContractsConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  // Get the current round start timepoint for the neutral checkpoint
  console.log("Getting current round snapshot for neutral checkpoint...")
  const xAllocationVoting = await ethers.getContractAt("XAllocationVoting", envConfig.xAllocationVotingContractAddress)
  const currentRoundId = await xAllocationVoting.currentRoundId()
  const roundStartTimepoint = currentRoundId > 0 ? await xAllocationVoting.roundSnapshot(currentRoundId) : 0
  console.log(`Current round: ${currentRoundId}, snapshot: ${roundStartTimepoint}`)

  console.log(
    `Upgrading VoterRewards contract at address: ${envConfig.voterRewardsContractAddress} on network: ${envConfig.network.name}`,
  )

  if (!envConfig.navigatorRegistryContractAddress) {
    throw new Error("Missing NavigatorRegistry contract address")
  }

  // V7: Rewards multipliers (freshness + governance intent)
  // initializeV7 creates two checkpoints per multiplier:
  // 1. At round start → neutral (1x) so current round is unaffected
  // 2. At current block → real values (takes effect next round)
  const voterRewardsV7 = (await upgradeProxy(
    "VoterRewardsV6",
    "VoterRewards",
    envConfig.voterRewardsContractAddress,
    [
      roundStartTimepoint,
      config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER1,
      config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER2,
      config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER3,
      config.VOTER_REWARDS_INTENT_MULTIPLIER_FOR_AGAINST,
      config.VOTER_REWARDS_INTENT_MULTIPLIER_ABSTAIN,
      envConfig.navigatorRegistryContractAddress,
    ],
    {
      version: 7,
    },
  )) as VoterRewards

  console.log(`VoterRewards upgraded`)

  const version = await voterRewardsV7.version()
  console.log(`New VoterRewards version: ${version}`)

  if (parseInt(version) !== 7) {
    throw new Error(`VoterRewards version is not 7: ${version}`)
  }

  // Grant GOVERNANCE_ROLE to timelock for multiplier governance
  const deployer = (await ethers.getSigners())[0]
  const GOVERNANCE_ROLE = await voterRewardsV7.GOVERNANCE_ROLE()

  console.log("Granting GOVERNANCE_ROLE to timelock...")
  await voterRewardsV7
    .connect(deployer)
    .grantRole(GOVERNANCE_ROLE, envConfig.timelockContractAddress)
    .then(async tx => await tx.wait())

  const hasRole = await voterRewardsV7.hasRole(GOVERNANCE_ROLE, envConfig.timelockContractAddress)
  if (!hasRole) {
    throw new Error("Failed to grant GOVERNANCE_ROLE to timelock in VoterRewards")
  }

  // check that neutral (1x) values were set at round start
  const MULTIPLIER_SCALE = await voterRewardsV7.MULTIPLIER_SCALE()
  console.log(`Multiplier scale: ${MULTIPLIER_SCALE}`)
  const [ft1, ft2, ft3] = await voterRewardsV7.getFreshnessMultipliers(0)
  const [ifa, iab] = await voterRewardsV7.getIntentMultipliers(0)
  console.log(`Freshness multiplier tier 1: ${ft1}`)
  console.log(`Freshness multiplier tier 2: ${ft2}`)
  console.log(`Freshness multiplier tier 3: ${ft3}`)
  console.log(`Intent multiplier for against: ${ifa}`)
  console.log(`Intent multiplier abstain: ${iab}`)
  if (
    ft1 !== MULTIPLIER_SCALE ||
    ft2 !== MULTIPLIER_SCALE ||
    ft3 !== MULTIPLIER_SCALE ||
    ifa !== MULTIPLIER_SCALE ||
    iab !== MULTIPLIER_SCALE
  ) {
    throw new Error("Neutral multipliers at round start were not correctly set")
  }

  // check that values were correctly set for next round
  const block = await ethers.provider.getBlockNumber()
  const [pt1, pt2, pt3] = await voterRewardsV7.getFreshnessMultipliers(block)
  const [pifa, piab] = await voterRewardsV7.getIntentMultipliers(block)
  console.log(`Next round Freshness multiplier tier 1: ${pt1}`)
  console.log(`Next round Freshness multiplier tier 2: ${pt2}`)
  console.log(`Next round Freshness multiplier tier 3: ${pt3}`)
  console.log(`Next round Intent multiplier for against: ${pifa}`)
  console.log(`Next round Intent multiplier abstain: ${piab}`)
  if (
    pt1 !== BigInt(config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER1) ||
    pt2 !== BigInt(config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER2) ||
    pt3 !== BigInt(config.VOTER_REWARDS_FRESHNESS_MULTIPLIER_TIER3) ||
    pifa !== BigInt(config.VOTER_REWARDS_INTENT_MULTIPLIER_FOR_AGAINST) ||
    piab !== BigInt(config.VOTER_REWARDS_INTENT_MULTIPLIER_ABSTAIN)
  ) {
    throw new Error("Freshness multipliers or intent multipliers were not correctly set for next round")
  }

  // check that navigator registry was correctly set
  const navigatorRegistry = await voterRewardsV7.navigatorRegistry()
  console.log(`Navigator registry: ${navigatorRegistry}`)
  if (navigatorRegistry.toLowerCase() !== envConfig.navigatorRegistryContractAddress.toLowerCase()) {
    throw new Error("Navigator registry was not correctly set")
  }

  console.log("VoterRewards v7 upgrade completed successfully")
  console.log("Execution completed")
  process.exit(0)
}

main()
