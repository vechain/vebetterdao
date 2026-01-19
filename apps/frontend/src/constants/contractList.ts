import { getConfig } from "@repo/config"

const config = getConfig()
// function that returns the contract from the list by the address
export const getContractByAddress = (address: string) => {
  return CONTRACT_LIST.find(contract => contract.contractAddress.toUpperCase() === address.toUpperCase())
}
export const CONTRACT_LIST = [
  {
    name: "B3TR",
    contractAddress: config.b3trContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "MINTER_ROLE", "PAUSER_ROLE"],
  },
  {
    name: "B3TR Governor",
    contractAddress: config.b3trGovernorAddress,
    roles: [
      "DEFAULT_ADMIN_ROLE",
      "PROPOSAL_EXECUTOR_ROLE",
      "PAUSER_ROLE",
      "GOVERNOR_FUNCTIONS_SETTINGS_ROLE",
      "CONTRACTS_ADDRESS_MANAGER_ROLE",
      "PROPOSAL_STATE_MANAGER_ROLE",
    ],
  },
  {
    name: "Emissions",
    contractAddress: config.emissionsContractAddress,
    roles: [
      "DEFAULT_ADMIN_ROLE",
      "MINTER_ROLE",
      "UPGRADER_ROLE",
      "CONTRACTS_ADDRESS_MANAGER_ROLE",
      "DECAY_SETTINGS_MANAGER_ROLE",
    ],
  },
  {
    name: "Galaxy Member",
    contractAddress: config.galaxyMemberContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE", "UPGRADER_ROLE", "MINTER_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE"],
  },
  {
    name: "Timelock",
    contractAddress: config.timelockContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "Proposer", "Executor", "UPGRADER_ROLE"],
  },
  {
    name: "Treasury",
    contractAddress: config.treasuryContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"],
  },
  {
    name: "B3TR MultiSig",
    contractAddress: config.b3trMultiSigAddress,
    roles: [],
  },
  {
    name: "VOT3",
    contractAddress: config.vot3ContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "PAUSER_ROLE"],
  },
  {
    name: "Voter Rewards",
    contractAddress: config.voterRewardsContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "VOTE_REGISTRAR_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE"],
  },
  {
    name: "X2Earn Apps",
    contractAddress: config.x2EarnAppsContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"],
  },
  {
    name: "X Allocation Pool",
    contractAddress: config.xAllocationPoolContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"],
  },
  {
    name: "X Allocation Voting",
    contractAddress: config.xAllocationVotingContractAddress,
    roles: [
      "DEFAULT_ADMIN_ROLE",
      "UPGRADER_ROLE",
      "GOVERNANCE_ROLE",
      "ROUND_STARTER_ROLE",
      "CONTRACTS_ADDRESS_MANAGER_ROLE",
    ],
  },
  {
    name: "X2Earn Rewards Pool",
    contractAddress: config.x2EarnRewardsPoolContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE", "IMPACT_KEY_MANAGER_ROLE"],
  },
  {
    name: "VeBetterPassport",
    contractAddress: config.veBetterPassportContractAddress,
    roles: [
      "DEFAULT_ADMIN_ROLE",
      "UPGRADER_ROLE",
      "SETTINGS_MANAGER_ROLE",
      "WHITELISTER_ROLE",
      "ACTION_REGISTRAR_ROLE",
      "ACTION_SCORE_MANAGER_ROLE",
      "SIGNALER_ROLE",
      "ROLE_GRANTER",
    ],
  },
  {
    name: "X2Earn Creator NFT",
    contractAddress: config.x2EarnCreatorContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "PAUSER_ROLE", "MINTER_ROLE", "BURNER_ROLE"],
  },
  {
    name: "Node Management Contract",
    contractAddress: config.nodeManagementContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE"],
  },
  {
    name: "Grants Manager",
    contractAddress: config.grantsManagerContractAddress,
    roles: [
      "DEFAULT_ADMIN_ROLE",
      "UPGRADER_ROLE",
      "GOVERNANCE_ROLE",
      "GRANTS_APPROVER_ROLE",
      "GRANTS_REJECTOR_ROLE",
      "PAUSER_ROLE",
    ],
  },
  {
    name: "Stargate",
    contractAddress: config.stargateNFTContractAddress,
    roles: [
      "DEFAULT_ADMIN_ROLE",
      "UPGRADER_ROLE",
      "PAUSER_ROLE",
      "LEVEL_OPERATOR_ROLE",
      "MANAGER_ROLE",
      "WHITELISTER_ROLE",
    ],
  },
  {
    name: "RelayerRewardsPool",
    contractAddress: config.relayerRewardsPoolContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "POOL_ADMIN_ROLE"],
  },
  {
    name: "Dynamic Base Allocation Pool",
    contractAddress: config.dbaPoolContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "DISTRIBUTOR_ROLE"],
  },
]
