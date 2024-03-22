import { getConfig } from "@repo/config"
import { ADMIN_ROLE, MINTER_ROLE, UPGRADER_ROLE, useHasRole } from "./useHasRole"
import { useMemo } from "react"

type useAccountPermissionsResponse = {
  isAdmin: boolean
  isAdminOfB3tr: boolean
  isAdminOfEmissions: boolean
  isAdminOfXAllocationVoting: boolean
  isAdminOfXAllocationPool: boolean
  isAdminOfDAO: boolean
  isAdminOfB3trBadge: boolean
  isAdminOfVot3: boolean
  isAdminOfVoterRewards: boolean
  isAdminOfTimeLock: boolean
  isMinterOfB3tr: boolean
  isMinterOfEmissions: boolean
  isUpgraderOfEmissions: boolean
  isUpgraderOfXAllocationVoting: boolean
  isUpgraderOfXAllocationPool: boolean
  isUpgraderOfB3trBadge: boolean
  isUpgraderOfVot3: boolean
  isUpgraderOfVoterRewards: boolean
  isUpgraderOfTimelock: boolean
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
  const { data: isAdminOfDAO } = useHasRole(ADMIN_ROLE, config.b3trGovernorAddress, address)
  const { data: isAdminOfB3trBadge } = useHasRole(ADMIN_ROLE, config.nftBadgeContractAddress, address)
  const { data: isAdminOfVot3 } = useHasRole(ADMIN_ROLE, config.vot3ContractAddress, address)
  const { data: isAdminOfVoterRewards } = useHasRole(ADMIN_ROLE, config.voterRewardsContractAddress, address)
  const { data: isAdminOfTimeLock } = useHasRole(ADMIN_ROLE, config.timelockContractAddress, address)

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
  const { data: isUpgraderOfB3trBadge } = useHasRole(UPGRADER_ROLE, config.nftBadgeContractAddress, address)
  const { data: isUpgraderOfVot3 } = useHasRole(UPGRADER_ROLE, config.vot3ContractAddress, address)
  const { data: isUpgraderOfVoterRewards } = useHasRole(UPGRADER_ROLE, config.voterRewardsContractAddress, address)
  const { data: isUpgraderOfTimelock } = useHasRole(UPGRADER_ROLE, config.timelockContractAddress, address)

  return useMemo(() => {
    return {
      isAdmin:
        isAdminOfB3tr ||
        isAdminOfEmissions ||
        isAdminOfXAllocationVoting ||
        isAdminOfXAllocationPool ||
        isAdminOfDAO ||
        isAdminOfB3trBadge ||
        isAdminOfVot3 ||
        isAdminOfVoterRewards,
      isAdminOfB3tr: isAdminOfB3tr ?? false,
      isAdminOfEmissions: isAdminOfEmissions ?? false,
      isAdminOfXAllocationVoting: isAdminOfXAllocationVoting ?? false,
      isAdminOfXAllocationPool: isAdminOfXAllocationPool ?? false,
      isAdminOfDAO: isAdminOfDAO ?? false,
      isAdminOfB3trBadge: isAdminOfB3trBadge ?? false,
      isAdminOfVot3: isAdminOfVot3 ?? false,
      isAdminOfVoterRewards: isAdminOfVoterRewards ?? false,
      isAdminOfTimeLock: isAdminOfTimeLock ?? false,
      isMinterOfB3tr: isMinterOfB3tr ?? false,
      isMinterOfEmissions: isMinterOfEmissions ?? false,
      isUpgraderOfEmissions: isUpgraderOfEmissions ?? false,
      isUpgraderOfXAllocationVoting: isUpgraderOfXAllocationVoting ?? false,
      isUpgraderOfXAllocationPool: isUpgraderOfXAllocationPool ?? false,
      isUpgraderOfB3trBadge: isUpgraderOfB3trBadge ?? false,
      isUpgraderOfVot3: isUpgraderOfVot3 ?? false,
      isUpgraderOfVoterRewards: isUpgraderOfVoterRewards ?? false,
      isUpgraderOfTimelock: isUpgraderOfTimelock ?? false,
    }
  }, [
    isAdminOfB3tr,
    isAdminOfEmissions,
    isAdminOfXAllocationVoting,
    isAdminOfXAllocationPool,
    isAdminOfDAO,
    isAdminOfB3trBadge,
    isAdminOfVot3,
    isAdminOfVoterRewards,
    isMinterOfB3tr,
    isMinterOfEmissions,
    isUpgraderOfEmissions,
    isUpgraderOfXAllocationVoting,
    isUpgraderOfXAllocationPool,
    isUpgraderOfB3trBadge,
    isUpgraderOfVot3,
    isUpgraderOfVoterRewards,
    isUpgraderOfTimelock,
  ])
}
