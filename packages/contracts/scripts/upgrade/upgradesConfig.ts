export interface UpgradeContract {
  name: string
  versions: readonly string[]
  descriptions: Record<string, string>
}

export const upgradeConfig: Record<string, UpgradeContract> = {
  VoterRewards: {
    name: "voter-rewards",
    versions: ["v2", "v3"],
    descriptions: {
      v2: "Add the ability to toggle quadratic rewarding on and off.",
      v3: "Vechain Nodes x GM upgrades feature",
    },
  },
  B3TRGovernor: {
    name: "b3tr-governor",
    versions: ["v2"],
    descriptions: {
      v2: "Give ability to contract admins to can call governance only functions",
    },
  },
  XAllocationVoting: {
    name: "x-allocation-voting",
    versions: ["v2", "v3"],
    descriptions: {
      v2: "Fix XAllocation voting so that a user cannot vote for an XApp with a vote weight less than 1",
      v3: "Update X2Earn interface to include new endorsement feature",
    },
  },
  X2EarnRewardsPool: {
    name: "x2-earn-rewards-pool",
    versions: ["v2", "v3"],
    descriptions: {
      v2: "Add onchain impacts and proof generation",
      v3: "Update X2Earn interface to include new endorsement feature",
    },
  },
  X2EarnApps: {
    name: "x2-earn-apps",
    versions: ["v2"],
    descriptions: {
      v2: "Add xapp endorsment module",
    },
  },
  XAllocationPool: {
    name: "x-allocation-pool",
    versions: ["v2"],
    descriptions: {
      v2: "Update X2Earn interface to include new endorsement feature",
    },
  },
  GalaxyMember: {
    name: "galaxy-member",
    versions: ["v2"],
    descriptions: {
      v2: "Vechain Nodes x GM upgrades feature",
    },
  },
} as const
