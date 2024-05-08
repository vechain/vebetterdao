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
  X2EarnAppsJson,
} from "@repo/contracts"

import { getConfig } from "@repo/config"
import { abi } from "thor-devkit"

const config = getConfig()

export type ExecutorAvailableContracts = {
  abi: JsonContractType
  address: string
}

type JsonContractType = {
  _format: string
  contractName: string
  abi: ((
    | Omit<abi.Function.Definition, "type" | "name" | "stateMutability" | "inputs">
    | Omit<abi.Event.Definition, "type" | "name" | "stateMutability" | "inputs">
  ) & {
    type: string
    name?: string
    stateMutability?: string
    inputs?: (Omit<abi.Function.Parameter, "indexed"> & {
      indexed?: boolean
    })[]
  })[]
  bytecode: string
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

export const getFunctionDefinitionFromAbi = (jsonContract: JsonContractType, functionName: string) => {
  const abiDefinition = jsonContract.abi.find(f => f.name === functionName) as abi.Function.Definition | undefined
  if (!abiDefinition) throw new Error(`${functionName} not found in contract ${jsonContract.contractName}`)
  return abiDefinition
}

export type GovernanceFeaturedFunction = {
  name: string
  description: string
  abiDefinition: Omit<abi.Function.Definition, "inputs"> & {
    inputs: (abi.Function.Parameter & {
      requiresEthParse?: boolean
    })[]
  }
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
        abiDefinition: (() => {
          const transferB3trDefinition = getFunctionDefinitionFromAbi(TreasuryContractJson, "transferB3TR")
          return {
            ...transferB3trDefinition,
            inputs: transferB3trDefinition.inputs.map(input => ({
              ...input,
              requiresEthParse: input.name === "_to",
            })),
          }
        })(),
      },
    ],
  },
  {
    name: "Governance",
    description: "Change the params that govern the DAO",
    contract: { abi: B3TRGovernorJson, address: config.b3trGovernorAddress },
    functions: [
      {
        name: "Update voting threshold",
        description: "Change the amount of VOT3 required for the quorum of a proposal",
        abiDefinition: getFunctionDefinitionFromAbi(B3TRGovernorJson, "setVotingThreshold"),
      },
      {
        name: "Update deposit threshold percentage",
        description: "Change the amount of VOT3 required to be deposited to create a proposal",
        abiDefinition: getFunctionDefinitionFromAbi(B3TRGovernorJson, "setDepositThresholdPercentage"),
      },
      {
        name: "Update minimum voting delay",
        description: "Change the delay before a proposal can be voted",
        abiDefinition: getFunctionDefinitionFromAbi(B3TRGovernorJson, "setMinVotingDelay"),
      },
      {
        name: "Update quorum numerator",
        description: "Change the amount of votes required for a proposal to pass",
        abiDefinition: getFunctionDefinitionFromAbi(B3TRGovernorJson, "updateQuorumNumerator"),
      },
      {
        name: "Update execution delay",
        description: "Update the delay between proposal queue and execution",
        abiDefinition: getFunctionDefinitionFromAbi(TimeLockContractJson, "updateDelay"),
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
        abiDefinition: getFunctionDefinitionFromAbi(XAllocationVotingJson, "updateQuorumNumerator"),
      },
      {
        name: "Update apps base allocation percentage",
        description: "Change the base allocation percentage for apps",
        abiDefinition: getFunctionDefinitionFromAbi(XAllocationVotingJson, "setBaseAllocationPercentage"),
      },
      {
        name: "Update app shares cap",
        description: "Change the percentage that is shared between apps for the allocation round",
        abiDefinition: getFunctionDefinitionFromAbi(XAllocationVotingJson, "setAppSharesCap"),
      },
    ],
  },
  {
    name: "X2Earn",
    description: "Change the params that govern the X2Earn pool",
    contract: { abi: X2EarnAppsJson, address: config.x2EarnAppsContractAddress },
    functions: [
      {
        name: "Change an app voting eligibility",
        description: "Change the eligibility of an app to vote in the allocation rounds",
        abiDefinition: getFunctionDefinitionFromAbi(X2EarnAppsJson, "setVotingEligibility"),
      },
    ],
  },
]
