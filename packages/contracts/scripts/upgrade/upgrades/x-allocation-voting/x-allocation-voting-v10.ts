import { getConfig } from "@repo/config"
import { saveLibrariesToFile, upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { XAllocationVoting } from "../../../../typechain-types"
import { xAllocationVotingLibraries } from "../../../libraries/xAllocationVotingLibraries"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log("Deploying XAllocationVoting V10 libraries...")
  const xAllocLibs = await xAllocationVotingLibraries(true)

  const libraryAddresses: Record<string, string> = {
    AutoVotingLogic: await xAllocLibs.AutoVotingLogic.getAddress(),
    ExternalContractsUtils: await xAllocLibs.ExternalContractsUtils.getAddress(),
    VotingSettingsUtils: await xAllocLibs.VotingSettingsUtils.getAddress(),
    VotesUtils: await xAllocLibs.VotesUtils.getAddress(),
    VotesQuorumFractionUtils: await xAllocLibs.VotesQuorumFractionUtils.getAddress(),
    RoundEarningsSettingsUtils: await xAllocLibs.RoundEarningsSettingsUtils.getAddress(),
    RoundFinalizationUtils: await xAllocLibs.RoundFinalizationUtils.getAddress(),
    RoundsStorageUtils: await xAllocLibs.RoundsStorageUtils.getAddress(),
    RoundVotesCountingUtils: await xAllocLibs.RoundVotesCountingUtils.getAddress(),
  }

  console.log("Libraries deployed:", libraryAddresses)

  console.log(
    `Upgrading XAllocationVoting contract at address: ${config.xAllocationVotingContractAddress} on network: ${config.network.name}`,
  )

  // V10: Fix relayer vote double-processing (no reinitializer needed)
  const xAllocationVoting = (await upgradeProxy(
    "XAllocationVotingV9",
    "XAllocationVoting",
    config.xAllocationVotingContractAddress,
    [],
    {
      version: 10,
      libraries: libraryAddresses,
    },
  )) as XAllocationVoting

  console.log(`XAllocationVoting upgraded`)

  const version = await xAllocationVoting.version()
  console.log(`New XAllocationVoting version: ${version}`)

  if (parseInt(version) !== 10) {
    throw new Error(`XAllocationVoting version is not the expected one: ${version}`)
  }

  await saveLibrariesToFile({ XAllocationVoting: libraryAddresses })

  console.log("Execution completed")

  process.exit(0)
}

main()
