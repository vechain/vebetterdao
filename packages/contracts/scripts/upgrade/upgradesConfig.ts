export const upgradeConfig = {
  "Voter Rewards": {
    name: "voter-rewards",
    versions: ["v2"],
    descriptions: {
      v2: "Add the ability to toggle quadratic rewarding on and off.",
    },
  },
  "B3TR Governor": {
    name: "b3tr-governor",
    versions: ["v2", "v3"],
    descriptions: {
      v2: "Fix XAllocation voting so that a user cannot vote for an XApp with a vote weight less than 1",
      v3: "Add the ability to toggle quadratic voting on and off.",
    },
  },
  "XAllocation Voting": {
    name: "x-allocation-voting",
    versions: ["v2"],
    descriptions: {
      v2: "Fix XAllocation voting so that a user cannot vote for an XApp with a vote weight less than 1",
    },
  },
  "XAllocation Pool": {
    name: "x-allocation-pool",
    versions: ["v2"],
    descriptions: {
      v2: "Add the abilty to toggle quadratic funding on and off.",
    },
  },
  "X2Earn Rewards Pool": {
    name: "x2earn-rewards-pool",
    versions: ["v2"],
    descriptions: {
      v2: "Add onchain impacts and proof generation",
    },
  },
} as const
