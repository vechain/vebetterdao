import { getConfig } from "@repo/config"
import { saveLibrariesToFile, upgradeProxy } from "../../../helpers"
import { EnvConfig } from "@repo/config/contracts"
import { B3TRGovernor } from "../../../../typechain-types"
import { governanceLibraries } from "../../../libraries"
import { ethers } from "hardhat"

const MAX_PAYEES_PER_PROPOSAL = 20

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)

  if (!config.treasuryContractAddress) {
    throw new Error("Missing Treasury contract address")
  }

  console.log("Deploying B3TRGovernor V11 libraries...")
  const {
    GovernorClockLogicLib,
    GovernorConfiguratorLib,
    GovernorDepositLogicLib,
    GovernorFunctionRestrictionsLogicLib,
    GovernorProposalLogicLib,
    GovernorQuorumLogicLib,
    GovernorStateLogicLib,
    GovernorVotesLogicLib,
    GovernorCommunityExecutionLogicLib,
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
    GovernorCommunityExecutionLogic: await GovernorCommunityExecutionLogicLib.getAddress(),
  }

  console.log("Libraries deployed:", libraryAddresses)

  console.log(
    `Upgrading B3TRGovernor contract at address: ${config.b3trGovernorAddress} on network: ${config.network.name}`,
  )

  // V11: Community Execution Framework — per-proposal B3TR budget, developer payee
  // registry, and pull-based payouts from the Treasury after proposal completion.
  const governor = (await upgradeProxy(
    "B3TRGovernorV10",
    "B3TRGovernor",
    config.b3trGovernorAddress,
    [config.treasuryContractAddress, MAX_PAYEES_PER_PROPOSAL],
    {
      version: 11,
      libraries: libraryAddresses,
    },
  )) as B3TRGovernor

  console.log("B3TRGovernor upgraded")

  const version = await governor.version()
  console.log(`New B3TRGovernor version: ${version}`)

  if (parseInt(version) !== 11) {
    throw new Error(`B3TRGovernor version is not the expected one: ${version}`)
  }

  // Grant Treasury.GOVERNANCE_ROLE to the Governor so claimPayout / claimAllPayouts
  // can pull B3TR directly from Treasury.
  const treasury = await ethers.getContractAt("Treasury", config.treasuryContractAddress)
  const governorAddress = await governor.getAddress()
  const GOVERNANCE_ROLE = await treasury.GOVERNANCE_ROLE()

  const alreadyHasRole = await treasury.hasRole(GOVERNANCE_ROLE, governorAddress)
  if (alreadyHasRole) {
    console.log("B3TRGovernor already holds Treasury.GOVERNANCE_ROLE")
  } else {
    console.log(`Granting Treasury.GOVERNANCE_ROLE to B3TRGovernor (${governorAddress})...`)
    const tx = await treasury.grantRole(GOVERNANCE_ROLE, governorAddress)
    await tx.wait()
    const hasRoleNow = await treasury.hasRole(GOVERNANCE_ROLE, governorAddress)
    if (!hasRoleNow) {
      throw new Error("Failed to grant Treasury.GOVERNANCE_ROLE to B3TRGovernor")
    }
    console.log("Treasury.GOVERNANCE_ROLE granted to B3TRGovernor")
  }

  console.log("Execution completed")

  await saveLibrariesToFile({ B3TRGovernor: libraryAddresses })
  process.exit(0)
}

main()
