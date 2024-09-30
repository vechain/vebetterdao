import config from "@repo/config/local"

export const CONTRACT_LIST = [
  {
    name: "B3TR Contract",
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
    ],
  },
  {
    name: "Emissions Contract",
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
    name: "Galaxy Member Contract",
    contractAddress: config.galaxyMemberContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE", "UPGRADER_ROLE", "MINTER_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE"],
  },
  {
    name: "Timelock Contract",
    contractAddress: config.timelockContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "Proposer", "Executor", "UPGRADER_ROLE"],
  },
  {
    name: "Treasury Contract",
    contractAddress: config.treasuryContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "PAUSER_ROLE", "UPGRADER_ROLE", "GOVERNANCE_ROLE"],
  },
  {
    name: "VOT3 Contract",
    contractAddress: config.vot3ContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "PAUSER_ROLE"],
  },
  {
    name: "Voter Rewards Contract",
    contractAddress: config.voterRewardsContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE", "VOTE_REGISTRAR_ROLE", "CONTRACTS_ADDRESS_MANAGER_ROLE"],
  },
  {
    name: "X2Earn Apps Contract",
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
    name: "Node Management Contract",
    contractAddress: config.nodeManagementContractAddress,
    roles: ["DEFAULT_ADMIN_ROLE", "UPGRADER_ROLE"],
  },
]
