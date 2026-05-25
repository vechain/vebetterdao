import { HexUInt, TransactionClause } from "@vechain/sdk-core"
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
 * Builds a transaction body with the specified clause and gas settings.
 * Automatically applies EIP-1559 fee headroom (2x baseFee + priorityFee) post-Galactica
 * so transactions survive rising baseFees during congestion.
 */
const buildTxBody = async (thor: ThorClient, clauses: TransactionClause[], totalGas?: number) => {
  const useGas = totalGas || maxGasLimit / 2

  const isGalactica = await thor.forkDetector.isGalacticaForked("best")
  if (!isGalactica) {
    return await thor.transactions.buildTransactionBody(clauses, useGas)
  }

  const baseFeeHex = await thor.blocks.getBestBlockBaseFeePerGas()
  const priorityFeeHex = await thor.gas.getMaxPriorityFeePerGas()

  const baseFee = baseFeeHex ? HexUInt.of(baseFeeHex).bi : 0n
  const priorityFee = HexUInt.of(priorityFeeHex).bi

  // 2x baseFee headroom: survives ~6 consecutive full blocks of rising fees
  const maxFeePerGas = HexUInt.of(baseFee * 2n + priorityFee).toString()
  const maxPriorityFeePerGas = HexUInt.of(priorityFee).toString()

  return await thor.transactions.buildTransactionBody(clauses, useGas, {
    maxFeePerGas,
    maxPriorityFeePerGas,
  })
}

export { buildTxBody, buildGasEstimate }
