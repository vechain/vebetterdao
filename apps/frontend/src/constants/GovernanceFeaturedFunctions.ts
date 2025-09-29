import { abi } from "thor-devkit"
import { JsonContractType } from "@repo/utils/ContractUtils"

/**
 * Used in GovernanceFeaturedFunctions to display the function name and the parameters
 */
export type ExecutorAvailableContracts = {
  abi: JsonContractType
  address: string
}

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
