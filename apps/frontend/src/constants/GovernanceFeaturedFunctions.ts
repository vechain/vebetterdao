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
  TreasuryJson,
} from "@repo/contracts"

import { getConfig, getContractsConfig } from "@repo/config"
import { abi } from "thor-devkit"
import { JsonContractType, resolveAbiFunctionFromCalldata } from "@repo/utils/ContractUtils"
import { ProposalFormAction } from "@/store"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { EnvConfig } from "@repo/config/contracts"

const config = getConfig()

/**
 * Used in GovernanceFeaturedFunctions to display the function name and the parameters
 */
export type ExecutorAvailableContracts = {
  abi: JsonContractType
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
  { abi: TreasuryJson, address: config.treasuryContractAddress },
]

/**
 *  Get a function definition from the contract ABI using the function name
 * @param jsonContract  The contract ABI
 * @param functionName  The function name to get the definition of
 * @returns  The function definition
 */
export const getFunctionDefinitionFromAbi = (jsonContract: JsonContractType, functionName: string) => {
  const abiDefinition = jsonContract.abi.find(f => f.name === functionName) as abi.Function.Definition | undefined
  if (!abiDefinition) throw new Error(`${functionName} not found in contract ${jsonContract.contractName}`)
  return abiDefinition
}

/**
 * Given a list of targets and calldatas, it returns a list of actions with the contract address, calldata, name, description and abiDefinition
 * @param targets The list of contract addresses
 * @param calldatas The list of calldatas
 * @param contractsToCheck  The list of featured contracts to check
 * @returns  The list of actions
 */
export const getActionsFromTargetsAndCalldatas = (
  targets: string[],
  calldatas: string[],
  contractsToCheck: GovernanceFeaturedContractWithFunctions[],
) => {
  if (targets.length !== calldatas.length) throw new Error("targets and calldats length mismatch")
  return targets.map((target, index) => {
    const calldata = calldatas[index] as string
    const relatedContract = contractsToCheck.find(contract => compareAddresses(contract.contract.address, target))
    if (!relatedContract) throw new Error("Contract not found")

    const decodedFunctionFragment = resolveAbiFunctionFromCalldata(calldata, relatedContract.contract.abi)
    if (!decodedFunctionFragment || !decodedFunctionFragment.name)
      throw new Error("Function definition not found or name not found")

    const featuredFunction = relatedContract.functions.find(f => f.abiDefinition.name === decodedFunctionFragment.name)
    if (!featuredFunction) throw new Error("Function not found in contract ABI")

    return {
      contractAddress: target,
      calldata,
      name: featuredFunction.name,
      description: featuredFunction.description,
      abiDefinition: featuredFunction.abiDefinition,
    } as ProposalFormAction
  })
}

export type GovernanceFeaturedFunction = {
  name: string
  description: string
  icon?: string
  abiDefinition: Omit<abi.Function.Definition, "inputs"> & {
    inputs: (abi.Function.Parameter & {
      requiresEthParse?: boolean
    })[]
  }
}
export type GovernanceFeaturedContractWithFunctions = {
  name: string
  description: string

  contract: ExecutorAvailableContracts
  functions: GovernanceFeaturedFunction[]
}

/**
 *  List of featured contracts with their functions that will be displayed in the NewProposalFlow page
 */
export const GovernanceFeaturedContractsWithFunctions: GovernanceFeaturedContractWithFunctions[] = [
  {
    name: "Treasury",
    description: "Perform operations using the funds of the DAO",
    contract: { abi: TreasuryContractJson, address: config.treasuryContractAddress },
    functions: [
      {
        name: "Transfer B3TR from treasury",
        icon: "/assets/icons/arrow-right.svg",
        description: "Transfer treasury B3TR tokens to a recipient",
        abiDefinition: (() => {
          const transferB3trDefinition = getFunctionDefinitionFromAbi(TreasuryContractJson, "transferB3TR")
          return {
            ...transferB3trDefinition,
            inputs: transferB3trDefinition.inputs.map(input => ({
              ...input,
              requiresEthParse: input.name === "_value",
            })),
          }
        })(),
      },
    ],
  },
  {
    name: "Governance",
    description: "Change the params that govern the DAO or upgrade the Governor contract",
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
      {
        name: "Upgrade B3TR Governor contract",
        icon: "/assets/icons/contract-upgrade.svg",
        description: "Upgrade the B3TR Governor contract to a new version",
        abiDefinition: getFunctionDefinitionFromAbi(B3TRGovernorJson, "upgradeToAndCall"),
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

/**
 * Get the list of contracts that are whitelisted in the current environment (uses the contract whitelist in the contracts config)
 * @returns  The list of contracts that are whitelisted in the current environment
 */
export const getEnvWhitelistedContractsWithFunctions = (env: EnvConfig): GovernanceFeaturedContractWithFunctions[] => {
  const config = getContractsConfig(env)
  const whitelistedContracts = config.B3TR_GOVERNOR_WHITELISTED_METHODS

  return GovernanceFeaturedContractsWithFunctions.filter(contract => {
    return Object.keys(whitelistedContracts).includes(contract.contract.abi.contractName)
  }).map(contract => {
    const whitelistedFunctions = whitelistedContracts[contract.contract.abi.contractName] as string[]
    const functions = contract.functions.filter(f => whitelistedFunctions.includes(f.abiDefinition.name))
    return {
      ...contract,
      functions,
    }
  })
}
