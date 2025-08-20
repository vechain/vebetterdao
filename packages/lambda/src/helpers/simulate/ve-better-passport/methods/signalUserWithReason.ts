import { FunctionFragment } from "ethers"

import { ThorClient } from "@vechain/sdk-network"
import { clauseBuilder } from "@vechain/sdk-core"
import { VeBetterPassport__factory } from "@vechain-kit/vebetterdao-contracts"
import localConfig from "@repo/config/local"

import { getCallerWalletInfo } from "./config"

/**
 * Signals a user with a given reason.
 * @param userAddress - The address of the user to signal.
 * @param reason - The reason for signaling the user.
 * @returns An object containing the transaction receipt and gas result.
 */
export const signalUserWithReason = async (thor: ThorClient, userAddress: string, reason: string) => {
  const { walletAddress, privateKey } = getCallerWalletInfo()

  const clause = clauseBuilder.functionInteraction(
    localConfig.veBetterPassportContractAddress,
    VeBetterPassport__factory.createInterface().getFunction("signalUserWithReason") as FunctionFragment,
    [userAddress, reason],
  )

  const gasResult = await thor.gas.estimateGas([clause], walletAddress)
  if (gasResult.reverted) {
    console.error("Txn (Gas) reverted:", gasResult.revertReasons, gasResult.vmErrors)
    throw new Error(`Txn (Gas) reverted: ${JSON.stringify(gasResult?.revertReasons)}`)
  }

  const txBody = await thor.transactions.buildTransactionBody([clause], gasResult.totalGas)
  const signedTx = await thor.transactions.signTransaction(txBody, privateKey)
  const tx = await thor.transactions.sendTransaction(signedTx)
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}
