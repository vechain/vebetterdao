import { EnhancedClause } from "@vechain/vechain-kit"
import { Interface } from "ethers"

// Define a type to infer method names from the function definition
type MethodName<T> = T extends (nameOrSignature: infer U) => any ? U : never

/**
 * Parameters for building a clause.
 */
export type BuildClauseParams<T extends Interface> = {
  contractInterface: T // The contract interface
  method: MethodName<T["getFunction"]> // The method name
  args?: unknown[] // Optional arguments for the method
  value?: number // The value to be sent with the transaction
} & Omit<EnhancedClause, "data" | "abi" | "value">

/**
 * Builds a clause for sending a transaction.
 * @param contractInterface The contract interface.
 * @param method The method name.
 * @param args Optional arguments for the method.
 * @param value The value to be sent with the transaction.
 * @returns The built clause.
 */
export const buildClause = <T extends Interface>({
  value = 0,
  contractInterface,
  args = [],
  method,
  ...others
}: BuildClauseParams<T>): EnhancedClause => {
  return {
    value,
    data: contractInterface.encodeFunctionData(method, args),
    abi: JSON.parse(JSON.stringify(contractInterface.getFunction(method))),
    ...others,
  }
}
