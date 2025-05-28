import { getConfig } from "@repo/config"
import { AccessControl__factory } from "@repo/contracts/typechain-types"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { abi } from "thor-devkit"
import { getBytes32Role } from "./useHasRole"

const fragment = AccessControl__factory.createInterface().getFunction("hasRole").format("json")
const hasRoleAbi = new abi.Function(JSON.parse(fragment))

const config = getConfig()
type AccountPermissionResponse = {
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
  isAdminOfVeBetterPassport: boolean
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
  isUpgraderOfVeBetterPassport: boolean
  isProposalExecutor: boolean
  isPassportSettingsManager: boolean
  isPassportBotSignaler: boolean
  isPassportActionRegistrar: boolean
  isPassportScoreManager: boolean
  isPassportWhitelister: boolean
  isMinterOfX2EarnCreator: boolean
  isBurnerOfX2EarnCreator: boolean
  isAdminOfX2EarnCreator: boolean
}

const CLAUSES_DATA: Record<keyof AccountPermissionResponse, { role: string; contractAddress: string }> = {
  isAdminOfB3tr: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.b3trContractAddress,
  },
  isAdminOfEmissions: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.emissionsContractAddress,
  },
  isAdminOfXAllocationVoting: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.xAllocationVotingContractAddress,
  },
  isAdminOfXAllocationPool: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.xAllocationPoolContractAddress,
  },
  isAdminOfB3TRGovernor: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.b3trGovernorAddress,
  },
  isAdminOfGalaxyMember: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.galaxyMemberContractAddress,
  },
  isAdminOfVot3: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.vot3ContractAddress,
  },
  isAdminOfVoterRewards: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.voterRewardsContractAddress,
  },
  isAdminOfTimeLock: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.timelockContractAddress,
  },
  isAdminOfTreasury: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.treasuryContractAddress,
  },
  isAdminOfX2EarnApps: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.x2EarnAppsContractAddress,
  },
  isAdminOfVeBetterPassport: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.veBetterPassportContractAddress,
  },
  isMinterOfB3tr: {
    role: "MINTER_ROLE",
    contractAddress: config.b3trContractAddress,
  },
  isMinterOfEmissions: {
    role: "MINTER_ROLE",
    contractAddress: config.emissionsContractAddress,
  },
  isUpgraderOfEmissions: {
    role: "UPGRADER_ROLE",
    contractAddress: config.emissionsContractAddress,
  },
  isUpgraderOfXAllocationVoting: {
    role: "UPGRADER_ROLE",
    contractAddress: config.xAllocationVotingContractAddress,
  },
  isUpgraderOfXAllocationPool: {
    role: "UPGRADER_ROLE",
    contractAddress: config.xAllocationPoolContractAddress,
  },
  isUpgraderOfGalaxyMember: {
    role: "UPGRADER_ROLE",
    contractAddress: config.galaxyMemberContractAddress,
  },
  isUpgraderOfVot3: {
    role: "UPGRADER_ROLE",
    contractAddress: config.vot3ContractAddress,
  },
  isUpgraderOfVoterRewards: {
    role: "UPGRADER_ROLE",
    contractAddress: config.voterRewardsContractAddress,
  },
  isUpgraderOfTimelock: {
    role: "UPGRADER_ROLE",
    contractAddress: config.timelockContractAddress,
  },
  isUpgraderOfTreasury: {
    role: "UPGRADER_ROLE",
    contractAddress: config.treasuryContractAddress,
  },
  isUpgraderOfX2EarnApps: {
    role: "UPGRADER_ROLE",
    contractAddress: config.x2EarnAppsContractAddress,
  },
  isUpgraderOfVeBetterPassport: {
    role: "UPGRADER_ROLE",
    contractAddress: config.veBetterPassportContractAddress,
  },
  isProposalExecutor: {
    role: "PROPOSAL_EXECUTOR_ROLE",
    contractAddress: config.b3trGovernorAddress,
  },
  isPassportSettingsManager: {
    role: "SETTINGS_MANAGER_ROLE",
    contractAddress: config.veBetterPassportContractAddress,
  },
  isPassportBotSignaler: {
    role: "SIGNALER_ROLE",
    contractAddress: config.veBetterPassportContractAddress,
  },
  isPassportActionRegistrar: {
    role: "ACTION_REGISTRAR_ROLE",
    contractAddress: config.veBetterPassportContractAddress,
  },
  isPassportWhitelister: {
    role: "WHITELISTER_ROLE",
    contractAddress: config.veBetterPassportContractAddress,
  },
  isPassportScoreManager: {
    role: "ACTION_SCORE_MANAGER_ROLE",
    contractAddress: config.veBetterPassportContractAddress,
  },
  isMinterOfX2EarnCreator: {
    role: "MINTER_ROLE",
    contractAddress: config.x2EarnCreatorContractAddress,
  },
  isBurnerOfX2EarnCreator: {
    role: "BURNER_ROLE",
    contractAddress: config.x2EarnCreatorContractAddress,
  },
  isAdminOfX2EarnCreator: {
    role: "DEFAULT_ADMIN_ROLE",
    contractAddress: config.x2EarnCreatorContractAddress,
  },
}

export const getAccountPermissionsQueryKey = (address: string) => ["ACCOUNT_PERMISSIONS", address]
/**
 * Get the permissions for an address
 *
 * @param address  - the address to get the permissions for
 * @returns useAccountPermissionsResponse
 */
export const useAccountPermissions = (
  address?: string,
): UseQueryResult<
  AccountPermissionResponse & {
    isAdmin: boolean
  }
> => {
  const thor = useThor()

  return useQuery({
    queryKey: getAccountPermissionsQueryKey(address ?? ""),
    enabled: !!address,
    queryFn: async () => {
      const clauses = Object.entries(CLAUSES_DATA).map(([_key, { role, contractAddress }]) => ({
        to: contractAddress,
        value: "0x0",
        data: hasRoleAbi.encode(getBytes32Role(role), address),
      }))

      // const a = executeMultipleClausesCall({
      //   thor,
      //   calls: [
      //     {
      //       a
      //     }
      //   ]
      // })

      const res = await thor.explain(clauses).execute()

      const roles = Object.entries(CLAUSES_DATA).reduce((acc, [key], index) => {
        if (res[index]?.reverted) throw new Error(`Reverted: ${key} with ${res[index]?.reverted}`)

        const role = res[index]?.data as string
        const decoded = hasRoleAbi.decode(role)

        return {
          ...acc,
          [key]: Boolean(decoded[0]),
        }
      }, {} as AccountPermissionResponse)

      const isAdmin =
        roles.isAdminOfB3tr ||
        roles.isAdminOfEmissions ||
        roles.isAdminOfXAllocationVoting ||
        roles.isAdminOfXAllocationPool ||
        roles.isAdminOfB3TRGovernor ||
        roles.isAdminOfGalaxyMember ||
        roles.isAdminOfVot3 ||
        roles.isAdminOfVoterRewards ||
        roles.isAdminOfX2EarnApps ||
        roles.isAdminOfVeBetterPassport ||
        roles.isAdminOfX2EarnCreator

      return {
        isAdmin,
        ...roles,
      }
    },
  })
}
