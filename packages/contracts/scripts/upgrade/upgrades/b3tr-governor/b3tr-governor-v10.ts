import { getConfig } from "@repo/config"
import { saveLibrariesToFile, upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { B3TRGovernor } from "../../../../typechain-types"
import { governanceLibraries } from "../../../libraries"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  console.log("Deploying B3TRGovernor V10 libraries...")
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

  const libraryAddresses = {
    GovernorClockLogic: await GovernorClockLogicLib.getAddress(),
    GovernorConfigurator: await GovernorConfiguratorLib.getAddress(),
    GovernorDepositLogic: await GovernorDepositLogicLib.getAddress(),
    GovernorFunctionRestrictionsLogic: await GovernorFunctionRestrictionsLogicLib.getAddress(),
    GovernorProposalLogic: await GovernorProposalLogicLib.getAddress(),
    GovernorQuorumLogic: await GovernorQuorumLogicLib.getAddress(),
    GovernorStateLogic: await GovernorStateLogicLib.getAddress(),
    GovernorVotesLogic: await GovernorVotesLogicLib.getAddress(),
  }

  console.log("Libraries deployed:", libraryAddresses)

  console.log(
    `Upgrading B3TRGovernor contract at address: ${config.b3trGovernorAddress} on network: ${config.network.name}`,
  )

  // V10: Refactored to library architecture + governance intent multiplier in GovernorVotesLogic
  const governor = (await upgradeProxy("B3TRGovernorV9", "B3TRGovernor", config.b3trGovernorAddress, [], {
    version: 10,
    libraries: libraryAddresses,
  })) as B3TRGovernor

  console.log(`B3TRGovernor upgraded`)

  const version = await governor.version()
  console.log(`New B3TRGovernor version: ${version}`)

  if (parseInt(version) !== 10) {
    throw new Error(`B3TRGovernor version is not the expected one: ${version}`)
  }

  console.log("Execution completed")

  await saveLibrariesToFile({ B3TRGovernor: libraryAddresses })
  process.exit(0)
}

main()
