import {
  B3trContractJson,
  B3TRGovernorJson,
  TimeLockContractJson,
  Vot3ContractJson,
  XAllocationPoolJson,
  XAllocationVotingJson,
  VoterRewardsContractJson,
  GalaxyMemberContractJson,
  EmissionsContractJson,
  TreasuryContractJson,
} from "@repo/contracts"

import { getConfig } from "@repo/config"

const config = getConfig()

export type ExecutorAvailableContracts = {
  abi: typeof B3trContractJson | typeof Vot3ContractJson | typeof B3TRGovernorJson | typeof TimeLockContractJson
  address: string
}

export const governanceAvailableContracts: ExecutorAvailableContracts[] = [
  { abi: B3trContractJson, address: config.b3trContractAddress },
  { abi: TreasuryContractJson, address: config.treasuryContractAddress },
  { abi: Vot3ContractJson, address: config.vot3ContractAddress },
  { abi: B3TRGovernorJson, address: config.b3trGovernorAddress },
  { abi: TimeLockContractJson, address: config.timelockContractAddress },
  { abi: XAllocationPoolJson, address: config.xAllocationPoolContractAddress },
  { abi: XAllocationVotingJson, address: config.xAllocationVotingContractAddress },
  { abi: VoterRewardsContractJson, address: config.voterRewardsContractAddress },
  { abi: GalaxyMemberContractJson, address: config.galaxyMemberContractAddress },
  { abi: EmissionsContractJson, address: config.emissionsContractAddress },
]

export type GovernanceFeaturedFunction = {
  name: string
  description: string
  functionName: string
  requiresEthParse?: boolean
}
type GovernanceFeaturedContractWithFunctions = {
  name: string
  description: string
  contract: ExecutorAvailableContracts
  functions: GovernanceFeaturedFunction[]
}

export const GovernanceFeaturedContractsWithFunctions: GovernanceFeaturedContractWithFunctions[] = [
  {
    name: "Treasury",
    description: "Perform operations using the funds of the DAO",
    contract: { abi: TreasuryContractJson, address: config.treasuryContractAddress },
    functions: [
      {
        name: "Transfer B3TR",
        description: "Transfer B3TR tokens to a recipient",
        functionName: "transferB3TR",
        requiresEthParse: true,
      },
    ],
  },
  {
    name: "Governance",
    description: "Change the params that govern the DAO",
    contract: { abi: B3TRGovernorJson, address: config.b3trGovernorAddress },
    functions: [
      {
        name: "Update proposal threshold",
        description: "Change the amount of VOT3 required to create a proposal",
        functionName: "setProposalThreshold",
      },
      {
        name: "Update minimum voting delay",
        description: "Change the delay before a proposal can be voted",
        functionName: "setMinVotingDelay",
      },
      {
        name: "Update quorum numerator",
        description: "Change the amount of votes required for a proposal to pass",
        functionName: "updateQuorumNumerator",
      },
      {
        name: "Update execution delay",
        description: "Update the delay between proposal queue and execution",
        functionName: "updateDelay",
      },
    ],
  },
  {
    name: "XAllocations",
    description: "Change the params that govern the XAllocation pool",
    contract: { abi: XAllocationVotingJson, address: config.xAllocationVotingContractAddress },
    functions: [
      {
        name: "Update quorum numerator",
        description: "Change the amount of votes required for an allocation round to pass",
        functionName: "updateQuorumNumerator",
      },
      {
        name: "Update apps base allocation percentage",
        description: "Change the base allocation percentage for apps",
        functionName: "setBaseAllocationPercentage",
      },
      {
        name: "Update app shares cap",
        description: "Change the percentage that is shared between apps for the allocation round",
        functionName: "setAppSharesCap",
      },
      {
        name: "Change an app voting eligibility",
        description: "Change the eligibility of an app to vote in the allocation rounds",
        functionName: "setVotingEligibility",
      },
    ],
  },
]
