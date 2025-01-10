export interface UpgradeContract {
  name: string
  configAddressField: string
  versions: readonly string[]
  descriptions: Record<string, string>
}

export const upgradeConfig: Record<string, UpgradeContract> = {
  "Voter Rewards": {
    name: "voter-rewards",
    configAddressField: "voterRewardsContractAddress",
    versions: ["v2", "v3", "v4"],
    descriptions: {
      v2: "Add the ability to toggle quadratic rewarding on and off.",
      v3: "Vechain Nodes x GM upgrades feature",
      v4: "Update GalaxyMember interface to use version 3",
    },
  },
  B3TRGovernor: {
    name: "b3tr-governor",
    versions: ["v2", "v3", "v4", "v5"],
    configAddressField: "b3trGovernorAddress",
    descriptions: {
      v2: "Give ability to contract admins to call governance only functions",
      v3: "Add the ability to toggle quadratic voting on and off.",
      v4: "Integrate VeBetterPassport contract",
      v5: "Vechain Nodes x GM upgrades feature",
    },
  },
  XAllocationVoting: {
    name: "x-allocation-voting",
    configAddressField: "xAllocationVotingContractAddress",
    versions: ["v2", "v3", "v4"],
    descriptions: {
      v2: "Integrate VeBetterPassport contract",
      v3: "Update X2Earn interface to include new endorsement feature",
      v4: "Update X2Earn interface to include node cooldown feature",
    },
  },
  "XAllocation Pool": {
    name: "x-allocation-pool",
    configAddressField: "xAllocationPoolContractAddress",
    versions: ["v2", "v3", "v4"],
    descriptions: {
      v2: "Add the abilty to toggle quadratic funding on and off.",
      v3: "Update X2Earn interface to include new endorsement feature",
      v4: "Update X2Earn interface to include node cooldown feature",
    },
  },
  X2EarnApps: {
    name: "x2-earn-apps",
    configAddressField: "x2EarnAppsContractAddress",
    versions: ["v2", "v3"],
    descriptions: {
      v2: "Add xapp endorsement module",
      v3: "Add node cooldown feature",
    },
  },
  "X2Earn Rewards Pool": {
    name: "x2-earn-rewards-pool",
    configAddressField: "x2EarnRewardsPoolContractAddress",
    versions: ["v2", "v3", "v4", "v5", "v6"],
    descriptions: {
      v2: "Add onchain impacts and proof generation",
      v3: "Integrate VeBetterPassport contract",
      v4: "Update X2Earn interface to include new endorsement feature",
      v5: "Update X2Earn interface to include node cooldown feature",
      v6: "Add funds locking mechanism to protect against exploits",
    },
  },
  Emissions: {
    name: "emissions",
    configAddressField: "emissionsContractAddress",
    versions: ["v2"],
    descriptions: {
      v2: "Aligns the emissions with the expected B3TR emissions schedule",
    },
  },
  "VeBetter Passport": {
    name: "vebetter-passport",
    configAddressField: "veBetterPassportContractAddress",
    versions: ["v2", "v3"],
    descriptions: {
      v2: "Prevent delegation of passports to entities",
      v3: "Add GM level to personhood check",
    },
  },
  "Galaxy Member": {
    name: "galaxy-member",
    configAddressField: "galaxyMemberContractAddress",
    versions: ["v2", "v3"],
    descriptions: {
      v2: "Vechain Nodes x GM upgrades feature",
      v3: "Add functions to checkpoint GM selection",
    },
  },
  "Node Management": {
    name: "node-management",
    configAddressField: "nodeManagementContractAddress",
    versions: ["v2"],
    descriptions: {
      v2: "Vechain Nodes x GM upgrades feature",
    },
  },
} as const
