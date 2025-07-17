import { TransactionClause } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"
import { maxGasLimit } from "./gas"

/**
 * Builds a gas estimate for a transaction with a 10% padding by default
 * @param thor - Thor client instance
 * @param clauses - Transaction clauses
 * @param walletAddress - Wallet address
 * @returns The gas estimate
 */
const buildGasEstimate = async (
  thor: ThorClient,
  clauses: TransactionClause[],
  walletAddress: string,
  gasPaddingInput?: number,
) => {
  const gasPadding = gasPaddingInput || 0.1 // 10% padding
  const gasResult = await thor.gas.estimateGas(clauses, walletAddress, { gasPadding })

  if (gasResult.reverted) {
    console.error("Gas estimation reverted:", gasResult.revertReasons, gasResult.vmErrors)
  }

  return gasResult
}

/**
 * Builds a transaction body with the specified clause and gas settings
 * @param thor - Thor client instance
 * @param clause - Transaction clause
 * @param gasResult - Gas estimation result - if not provided, the default is half of the max gas limit
 * @returns The built transaction body
 */
const buildTxBody = async (thor: ThorClient, clauses: TransactionClause[], totalGas: number) => {
  const useGas = totalGas || maxGasLimit / 2
  return await thor.transactions.buildTransactionBody(clauses, useGas)
}

export { buildTxBody, buildGasEstimate }
