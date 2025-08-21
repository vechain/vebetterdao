import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { VoterRewards } from "../../../../typechain-types"
import { ethers } from "hardhat"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log(
    `Upgrading VoterRewards contract at address: ${config.voterRewardsContractAddress} on network: ${config.network.name}`,
  )

  const xAllocationVoting = await ethers.getContractAt("XAllocationVoting", config.xAllocationVotingContractAddress)
  const xAllocationVotingVersion = await xAllocationVoting.version()
  if (parseInt(xAllocationVotingVersion) !== 7) {
    console.log(`XAllocationVoting version is not 7: ${xAllocationVotingVersion}`)
    console.log("Please upgrade XAllocationVoting contract first")
    process.exit(1)
  }

  const voterRewardsV6 = (await upgradeProxy(
    "VoterRewardsV5",
    "VoterRewards",
    config.voterRewardsContractAddress,
    [config.xAllocationVotingContractAddress, config.relayerRewardsPoolContractAddress],
    {
      version: 6,
    },
  )) as VoterRewards

  console.log(`VoterRewards upgraded`)

  // check that upgrade was successful
  const version = await voterRewardsV6.version()
  console.log(`New VoterRewards version: ${version}`)

  if (parseInt(version) !== 6) {
    throw new Error(`VoterRewards version is not 6: ${version}`)
  }

  console.log("Execution completed")
  process.exit(0)
}

// Execute the main function
main()
