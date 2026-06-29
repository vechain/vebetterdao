import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { VoterRewards } from "../../../../typechain-types"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log(
    `Upgrading VoterRewards contract at address: ${config.voterRewardsContractAddress} on network: ${config.network.name}`,
  )

  // V8 is a logic-only upgrade — snapshot-state delegation check + CLAIM action
  // decoupled from relayerFee > 0. No new storage, no reinitializer needed.
  const voterRewardsV8 = (await upgradeProxy("VoterRewardsV7", "VoterRewards", config.voterRewardsContractAddress, [], {
    version: 8,
  })) as VoterRewards

  console.log(`VoterRewards upgraded`)

  const version = await voterRewardsV8.version()
  console.log(`New VoterRewards version: ${version}`)

  if (parseInt(version) !== 8) {
    throw new Error(`VoterRewards version is not 8: ${version}`)
  }

  console.log("Execution completed")
  process.exit(0)
}

main()
