import { ABIContract, Hex } from "@vechain/sdk-core"
import type { AbiFunction, AbiParameter } from "viem"

export type ContractAbiParameter = AbiParameter & {
  name: string
  requiresEthParse?: boolean
}

export type ContractAbiDefinition = {
  type: string
  name?: string
  stateMutability?: string
  inputs?: ContractAbiParameter[]
  outputs?: AbiParameter[]
  [key: string]: unknown
}

export type ContractFunctionDefinition = Omit<AbiFunction, "inputs"> & {
  inputs: ContractAbiParameter[]
}

export type JsonContractAbi = {
  _format: string
  contractName: string
  sourceName: string
  abi: ContractAbiDefinition[]
}

/**
 * Used in GovernanaceFeaturedFunctions to display the function name and the parameters
 */
export type JsonContractType = {
  _format: string
  contractName: string
  abi: ContractAbiDefinition[]
  bytecode: string
}

export type DecodedFunctionData = Record<string, unknown>

const getFunctionAbi = (abiDefinition: ContractFunctionDefinition) => {
  return ABIContract.ofAbi([abiDefinition] as unknown as Parameters<typeof ABIContract.ofAbi>[0]).getFunction(
    abiDefinition.name,
  )
}

export const encodeFunctionCalldata = (abiDefinition: ContractFunctionDefinition, args: unknown[]) => {
  return getFunctionAbi(abiDefinition).encodeData(args).toString()
}

export const decodeFunctionCalldata = (
  calldata: string,
  abiDefinition: ContractFunctionDefinition,
): DecodedFunctionData => {
  const decoded = getFunctionAbi(abiDefinition).decodeData(Hex.of(calldata))

  return (abiDefinition.inputs ?? []).reduce<DecodedFunctionData>((acc, input, index) => {
    acc[input.name] = decoded.args?.[index]

    return acc
  }, {})
}

/**
 * Given a calldata and a contract ABI, it tries to resolve the function that is being called from the calldata
 * @param calldata  The calldata to resolve
 * @param contractAbi  The ABI of the contract
 * @returns  The resolved function
 */
export const resolveAbiFunctionFromCalldata = (calldata: string, contractAbi: JsonContractAbi | JsonContractType) => {
  for (const method of contractAbi.abi) {
    if (method.type !== "function" || !method.name || !method.inputs) continue

    const functionToCallHash = calldata.slice(0, 10)
    const methodNameAndParamsHash = getFunctionAbi(method as ContractFunctionDefinition).signatureHash

    if (functionToCallHash !== methodNameAndParamsHash) continue
    return method as ContractFunctionDefinition
  }
}
