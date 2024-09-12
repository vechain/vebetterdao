import { B3TRGovernorV1AdminUpgradeable } from "../../../typechain-types"
import { deployProxy } from "./../../../scripts/helpers/upgrades"
import { getGovernorLibrariesV1 } from "./libraries"

/**
 * Deploys B3TRGovernorV1 contract that is upgradeable by the admin.
 *
 * @warning This contract is used for testing purposes only.
 *
 * @param initializationData - Initialization data for the contract
 * @param initializationRolesData - Initialization roles data for the contract
 * @returns B3TRGovernorV1 contract instance
 */
export const deployGovernorAdminUpgradeable = async (
  initializationData: {
    vot3Token: string
    timelock: string
    xAllocationVoting: string
    b3tr: string
    quorumPercentage: number
    initialDepositThreshold: number
    initialMinVotingDelay: number
    initialVotingThreshold: bigint
    voterRewards: string
    isFunctionRestrictionEnabled: boolean
  },
  initializationRolesData: {
    governorAdmin: string
    pauser: string
    contractsAddressManager: string
    proposalExecutor: string
    governorFunctionSettingsRoleAddress: string
  },
) => {
  const governorLibrariesV1 = await getGovernorLibrariesV1()
  const governorAdminUpgradeable = (await deployProxy(
    "B3TRGovernorV1AdminUpgradeable",
    [initializationData, initializationRolesData],
    governorLibrariesV1,
  )) as B3TRGovernorV1AdminUpgradeable

  return governorAdminUpgradeable
}
