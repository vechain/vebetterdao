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
    versions: ["v2"],
    descriptions: {
      v2: "Add the ability to toggle quadratic rewarding on and off.",
    },
  },
  "B3TR Governor": {
    name: "b3tr-governor",
    versions: ["v2", "v3", "v4"],
    configAddressField: "b3trGovernorAddress",
    descriptions: {
      v2: "Fix XAllocation voting so that a user cannot vote for an XApp with a vote weight less than 1",
      v3: "Add the ability to toggle quadratic voting on and off.",
      v4: "Integrate VeBetterPassport contract",
    },
  },
  "XAllocation Voting": {
    name: "x-allocation-voting",
    configAddressField: "xAllocationVotingContractAddress",
    versions: ["v2"],
    descriptions: {
      v2: "Integrate VeBetterPassport contract",
    },
  },
  "XAllocation Pool": {
    name: "x-allocation-pool",
    configAddressField: "xAllocationPoolContractAddress",
    versions: ["v2"],
    descriptions: {
      v2: "Add the abilty to toggle quadratic funding on and off.",
    },
  },
  "X2Earn Rewards Pool": {
    name: "x2earn-rewards-pool",
    configAddressField: "x2EarnRewardsPoolContractAddress",
    versions: ["v2"],
    descriptions: {
      v2: "Add onchain impacts and proof generation",
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
} as const
