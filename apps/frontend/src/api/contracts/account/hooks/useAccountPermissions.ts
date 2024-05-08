import { getConfig } from "@repo/config"
import { ADMIN_ROLE, MINTER_ROLE, UPGRADER_ROLE, useHasRole } from "./useHasRole"
import { useMemo } from "react"

type useAccountPermissionsResponse = {
  isAdmin: boolean
  isAdminOfB3tr: boolean
  isAdminOfEmissions: boolean
  isAdminOfXAllocationVoting: boolean
  isAdminOfXAllocationPool: boolean
  isAdminOfB3TRGovernor: boolean
  isAdminOfGalaxyMember: boolean
  isAdminOfVot3: boolean
  isAdminOfVoterRewards: boolean
  isAdminOfTimeLock: boolean
  isAdminOfTreasury: boolean
  isAdminOfX2EarnApps: boolean
  isMinterOfB3tr: boolean
  isMinterOfEmissions: boolean
  isUpgraderOfEmissions: boolean
  isUpgraderOfXAllocationVoting: boolean
  isUpgraderOfXAllocationPool: boolean
  isUpgraderOfGalaxyMember: boolean
  isUpgraderOfVot3: boolean
  isUpgraderOfVoterRewards: boolean
  isUpgraderOfTimelock: boolean
  isUpgraderOfTreasury: boolean
  isUpgraderOfX2EarnApps: boolean
}

/**
 * Get the permissions for an address
 *
 * @param address  - the address to get the permissions for
 * @returns useAccountPermissionsResponse
 */
export const useAccountPermissions = (address?: string): useAccountPermissionsResponse => {
  const config = getConfig()

  const { data: isAdminOfB3tr } = useHasRole(ADMIN_ROLE, config.b3trContractAddress, address)
  const { data: isAdminOfEmissions } = useHasRole(ADMIN_ROLE, config.emissionsContractAddress, address)
  const { data: isAdminOfXAllocationVoting } = useHasRole(ADMIN_ROLE, config.xAllocationVotingContractAddress, address)
  const { data: isAdminOfXAllocationPool } = useHasRole(ADMIN_ROLE, config.xAllocationPoolContractAddress, address)
  const { data: isAdminOfB3TRGovernor } = useHasRole(ADMIN_ROLE, config.b3trGovernorAddress, address)
  const { data: isAdminOfGalaxyMember } = useHasRole(ADMIN_ROLE, config.galaxyMemberContractAddress, address)
  const { data: isAdminOfVot3 } = useHasRole(ADMIN_ROLE, config.vot3ContractAddress, address)
  const { data: isAdminOfVoterRewards } = useHasRole(ADMIN_ROLE, config.voterRewardsContractAddress, address)
  const { data: isAdminOfTimeLock } = useHasRole(ADMIN_ROLE, config.timelockContractAddress, address)
  const { data: isAdminOfTreasury } = useHasRole(ADMIN_ROLE, config.treasuryContractAddress, address)
  const { data: isAdminOfX2EarnApps } = useHasRole(ADMIN_ROLE, config.x2EarnAppsContractAddress, address)

  const { data: isMinterOfB3tr } = useHasRole(MINTER_ROLE, config.b3trContractAddress, address)
  const { data: isMinterOfEmissions } = useHasRole(MINTER_ROLE, config.emissionsContractAddress, address)

  const { data: isUpgraderOfEmissions } = useHasRole(UPGRADER_ROLE, config.emissionsContractAddress, address)
  const { data: isUpgraderOfXAllocationVoting } = useHasRole(
    UPGRADER_ROLE,
    config.xAllocationVotingContractAddress,
    address,
  )
  const { data: isUpgraderOfXAllocationPool } = useHasRole(
    UPGRADER_ROLE,
    config.xAllocationPoolContractAddress,
    address,
  )
  const { data: isUpgraderOfGalaxyMember } = useHasRole(UPGRADER_ROLE, config.galaxyMemberContractAddress, address)
  const { data: isUpgraderOfVot3 } = useHasRole(UPGRADER_ROLE, config.vot3ContractAddress, address)
  const { data: isUpgraderOfVoterRewards } = useHasRole(UPGRADER_ROLE, config.voterRewardsContractAddress, address)
  const { data: isUpgraderOfTimelock } = useHasRole(UPGRADER_ROLE, config.timelockContractAddress, address)
  const { data: isUpgraderOfTreasury } = useHasRole(UPGRADER_ROLE, config.treasuryContractAddress, address)
  const { data: isUpgraderOfX2EarnApps } = useHasRole(UPGRADER_ROLE, config.x2EarnAppsContractAddress, address)

  return useMemo(() => {
    return {
      isAdmin:
        isAdminOfB3tr ||
        isAdminOfEmissions ||
        isAdminOfXAllocationVoting ||
        isAdminOfXAllocationPool ||
        isAdminOfB3TRGovernor ||
        isAdminOfGalaxyMember ||
        isAdminOfVot3 ||
        isAdminOfVoterRewards ||
        isAdminOfX2EarnApps,
      isAdminOfB3tr: isAdminOfB3tr ?? false,
      isAdminOfEmissions: isAdminOfEmissions ?? false,
      isAdminOfXAllocationVoting: isAdminOfXAllocationVoting ?? false,
      isAdminOfXAllocationPool: isAdminOfXAllocationPool ?? false,
      isAdminOfB3TRGovernor: isAdminOfB3TRGovernor ?? false,
      isAdminOfGalaxyMember: isAdminOfGalaxyMember ?? false,
      isAdminOfVot3: isAdminOfVot3 ?? false,
      isAdminOfVoterRewards: isAdminOfVoterRewards ?? false,
      isAdminOfTimeLock: isAdminOfTimeLock ?? false,
      isAdminOfTreasury: isAdminOfTreasury ?? false,
      isAdminOfX2EarnApps: isAdminOfX2EarnApps ?? false,
      isMinterOfB3tr: isMinterOfB3tr ?? false,
      isMinterOfEmissions: isMinterOfEmissions ?? false,
      isUpgraderOfEmissions: isUpgraderOfEmissions ?? false,
      isUpgraderOfXAllocationVoting: isUpgraderOfXAllocationVoting ?? false,
      isUpgraderOfXAllocationPool: isUpgraderOfXAllocationPool ?? false,
      isUpgraderOfGalaxyMember: isUpgraderOfGalaxyMember ?? false,
      isUpgraderOfVot3: isUpgraderOfVot3 ?? false,
      isUpgraderOfVoterRewards: isUpgraderOfVoterRewards ?? false,
      isUpgraderOfTimelock: isUpgraderOfTimelock ?? false,
      isUpgraderOfTreasury: isUpgraderOfTreasury ?? false,
      isUpgraderOfX2EarnApps: isUpgraderOfX2EarnApps ?? false,
    }
  }, [
    isAdminOfB3tr,
    isAdminOfEmissions,
    isAdminOfXAllocationVoting,
    isAdminOfXAllocationPool,
    isAdminOfB3TRGovernor,
    isAdminOfGalaxyMember,
    isAdminOfVot3,
    isAdminOfVoterRewards,
    isMinterOfB3tr,
    isMinterOfEmissions,
    isUpgraderOfEmissions,
    isUpgraderOfXAllocationVoting,
    isUpgraderOfXAllocationPool,
    isUpgraderOfGalaxyMember,
    isUpgraderOfVot3,
    isUpgraderOfVoterRewards,
    isUpgraderOfTimelock,
    isUpgraderOfTreasury,
    isAdminOfTreasury,
    isAdminOfX2EarnApps,
    isUpgraderOfX2EarnApps,
  ])
}
