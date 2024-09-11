export interface UpgradeContract {
  name: string
  versions: readonly string[]
  descriptions: Record<string, string>
}

export const upgradeConfig: Record<string, UpgradeContract> = {
  "Voter Rewards": {
    name: "voter-rewards",
    versions: ["v2"],
    descriptions: {
      v2: "Add the ability to toggle quadratic rewarding on and off.",
    },
  },
  "B3TR Governor": {
    name: "b3tr-governor",
    versions: ["v2"],
    descriptions: {
      v2: "Give ability to contract admins to call governance-only functions.",
    },
  },
  "XAllocation Voting": {
    name: "x-allocation-voting",
    versions: ["v2"],
    descriptions: {
      v2: "Fix XAllocation voting so that a user cannot vote for an XApp with a vote weight less than 1.",
    },
  },
  "X2Earn Rewards Pool": {
    name: "x2earn-rewards-pool",
    versions: ["v2"],
    descriptions: {
      v2: "Add on-chain impacts and proof generation.",
    },
  },
  "Node Management": {
    name: "node-management",
    versions: ["v1"],
    descriptions: {
      v1: "Deploy the initial version of the NodeManagement contract.",
    },
  },
}
