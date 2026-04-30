import { getConfig } from "@repo/config"
import { upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { XAllocationVoting, XAllocationVotingV4 } from "../../../../typechain-types"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log(
    `Upgrading XAllocationVoting contract at address: ${config.xAllocationVotingContractAddress} on network: ${config.network.name}`,
  )

  const xAllocationVotingV4 = (await upgradeProxy(
    "XAllocationVotingV3",
    "XAllocationVotingV4",
    config.xAllocationVotingContractAddress,
    [],
    {
      version: 4,
    },
  )) as XAllocationVotingV4

  console.log(`XAllocationVoting upgraded`)

  // check that upgrade was successful
  const version = await xAllocationVotingV4.version()
  console.log(`New XAllocationVoting version: ${version}`)

  if (parseInt(version) !== 4) {
    throw new Error(`XAllocationVoting version is not 4: ${version}`)
  }

  console.log("Execution completed")
  process.exit(0)
}

// Execute the main function
main()
