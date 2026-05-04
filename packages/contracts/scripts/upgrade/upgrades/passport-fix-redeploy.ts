import { getConfig } from "@repo/config"
import { saveLibrariesToFile, upgradeProxy } from "../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { B3TRGovernor, XAllocationVoting } from "../../../typechain-types"
import { governanceLibraries } from "../../libraries"
import { xAllocationVotingLibraries } from "../../libraries/xAllocationVotingLibraries"

/**
 * Re-deploy XAllocationVoting and B3TRGovernor implementations (same version)
 * to pick up the passport validation fix in castNavigatorVote.
 *
 * No reinitializer — no new storage, no version bump.
 */
async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  // ==================== XAllocationVoting ====================

  console.log("\n=== XAllocationVoting ===")
  console.log("Deploying libraries...")
  const xAllocLibs = await xAllocationVotingLibraries(true)

  const xAllocLibraryAddresses: Record<string, string> = {
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

  console.log("Libraries deployed:", xAllocLibraryAddresses)
  console.log(`Upgrading at: ${config.xAllocationVotingContractAddress}`)

  // No reinitializer args — same version, just new implementation
  const xAllocationVoting = (await upgradeProxy(
    "XAllocationVoting",
    "XAllocationVoting",
    config.xAllocationVotingContractAddress,
    [],
    {
      version: 9,
      libraries: xAllocLibraryAddresses,
    },
  )) as XAllocationVoting

  const xVersion = await xAllocationVoting.version()
  console.log(`XAllocationVoting version: ${xVersion}`)
  if (parseInt(xVersion) !== 9) {
    throw new Error(`Unexpected version: ${xVersion}`)
  }

  await saveLibrariesToFile({ XAllocationVoting: xAllocLibraryAddresses })

  // ==================== B3TRGovernor ====================

  console.log("\n=== B3TRGovernor ===")
  console.log("Deploying libraries...")
  const {
    GovernorClockLogicLib,
    GovernorConfiguratorLib,
    GovernorDepositLogicLib,
    GovernorFunctionRestrictionsLogicLib,
    GovernorProposalLogicLib,
    GovernorQuorumLogicLib,
    GovernorStateLogicLib,
    GovernorVotesLogicLib,
  } = await governanceLibraries({ logOutput: true, latestVersionOnly: true })

  const govLibraryAddresses: Record<string, string> = {
    GovernorClockLogic: await GovernorClockLogicLib.getAddress(),
    GovernorConfigurator: await GovernorConfiguratorLib.getAddress(),
    GovernorDepositLogic: await GovernorDepositLogicLib.getAddress(),
    GovernorFunctionRestrictionsLogic: await GovernorFunctionRestrictionsLogicLib.getAddress(),
    GovernorProposalLogic: await GovernorProposalLogicLib.getAddress(),
    GovernorQuorumLogic: await GovernorQuorumLogicLib.getAddress(),
    GovernorStateLogic: await GovernorStateLogicLib.getAddress(),
    GovernorVotesLogic: await GovernorVotesLogicLib.getAddress(),
  }

  console.log("Libraries deployed:", govLibraryAddresses)
  console.log(`Upgrading at: ${config.b3trGovernorAddress}`)

  // No reinitializer args — same version, just new implementation
  const governor = (await upgradeProxy("B3TRGovernor", "B3TRGovernor", config.b3trGovernorAddress, [], {
    version: 10,
    libraries: govLibraryAddresses,
  })) as B3TRGovernor

  const gVersion = await governor.version()
  console.log(`B3TRGovernor version: ${gVersion}`)
  if (parseInt(gVersion) !== 10) {
    throw new Error(`Unexpected version: ${gVersion}`)
  }

  await saveLibrariesToFile({ B3TRGovernor: govLibraryAddresses })

  console.log("\n=== Done ===")
  process.exit(0)
}

main()
