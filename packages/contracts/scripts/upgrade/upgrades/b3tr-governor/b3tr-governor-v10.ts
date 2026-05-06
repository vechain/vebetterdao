import { getConfig } from "@repo/config"
import { saveLibrariesToFile, upgradeProxy } from "../../../helpers"
import { EnvConfig, getContractsConfig } from "@repo/config/contracts"
import { B3TRGovernor, NavigatorRegistry__factory } from "../../../../typechain-types"
import { governanceLibraries } from "../../../libraries"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const contractsConfig = getContractsConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  if (!config.navigatorRegistryContractAddress) {
    throw new Error("Missing NavigatorRegistry contract address")
  }
  if (!config.relayerRewardsPoolContractAddress) {
    throw new Error("Missing RelayerRewardsPool contract address")
  }

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

  // V10: Refactored to library architecture + governance intent multiplier + skip window
  const governor = (await upgradeProxy(
    "B3TRGovernorV9",
    "B3TRGovernor",
    config.b3trGovernorAddress,
    [
      config.navigatorRegistryContractAddress,
      config.relayerRewardsPoolContractAddress,
      contractsConfig.B3TR_GOVERNOR_SKIP_WINDOW_BLOCKS,
    ],
    {
      version: 10,
      libraries: libraryAddresses,
    },
  )) as B3TRGovernor

  console.log(`B3TRGovernor upgraded`)

  const version = await governor.version()
  console.log(`New B3TRGovernor version: ${version}`)

  if (parseInt(version) !== 10) {
    throw new Error(`B3TRGovernor version is not the expected one: ${version}`)
  }

  // check that navigator registry was correctly set by accessing directly the storage slot
  const navigatorRegistry = await governor.navigatorRegistry()
  console.log(`Navigator registry: ${navigatorRegistry}`)
  if (navigatorRegistry.toLowerCase() !== config.navigatorRegistryContractAddress.toLowerCase()) {
    throw new Error("Navigator registry was not correctly set")
  }

  const relayerRewardsPoolAddr = await governor.relayerRewardsPool()
  console.log(`Relayer rewards pool: ${relayerRewardsPoolAddr}`)
  if (relayerRewardsPoolAddr.toLowerCase() !== config.relayerRewardsPoolContractAddress.toLowerCase()) {
    throw new Error("Relayer rewards pool was not correctly set")
  }

  const skipWindow = await governor.governanceSkipWindowBlocks()
  console.log(`Governance skip window: ${skipWindow}`)
  if (Number(skipWindow) !== contractsConfig.B3TR_GOVERNOR_SKIP_WINDOW_BLOCKS) {
    throw new Error(
      `Governance skip window mismatch: ${skipWindow} !== ${contractsConfig.B3TR_GOVERNOR_SKIP_WINDOW_BLOCKS}`,
    )
  }

  // Whitelist NavigatorRegistry.deactivateNavigator for governance proposals
  console.log("Whitelisting NavigatorRegistry.deactivateNavigator...")
  const deactivateSelector = NavigatorRegistry__factory.createInterface().getFunction("deactivateNavigator")?.selector
  if (deactivateSelector) {
    const tx = await governor.setWhitelistFunction(config.navigatorRegistryContractAddress, deactivateSelector, true)
    await tx.wait()
    const isWhitelisted = await governor.isFunctionWhitelisted(
      config.navigatorRegistryContractAddress,
      deactivateSelector,
    )
    if (!isWhitelisted) {
      throw new Error("Failed to whitelist deactivateNavigator")
    }
    console.log("NavigatorRegistry.deactivateNavigator whitelisted successfully")
  }

  console.log("Execution completed")

  await saveLibrariesToFile({ B3TRGovernor: libraryAddresses })
  process.exit(0)
}

main()
