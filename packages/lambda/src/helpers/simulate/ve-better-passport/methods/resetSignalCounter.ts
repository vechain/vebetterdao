import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause, Transaction } from "@vechain/sdk-core"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import localConfig from "@repo/config/local"

import { getCallerWalletInfo } from "./config"

/**
 * Resets the signal counter for a banned wallet with a given reason.
 * @param bannedWallet - The address of the wallet to reset the signal counter for.
 * @param reason - The reason for resetting the signal counter.
 * @returns An object containing the transaction receipt and gas result.
 */
export const resetSignalCounter = async (thor: ThorClient, bannedWallet: string, reason: string) => {
  const { walletAddress, privateKey } = getCallerWalletInfo()

  const clause = Clause.callFunction(
    Address.of(localConfig.veBetterPassportContractAddress),
    ABIContract.ofAbi(VeBetterPassport__factory.abi).getFunction("resetUserSignalsWithReason"),
    [bannedWallet, reason],
  )

  const gasResult = await thor.gas.estimateGas([clause], walletAddress)
  if (gasResult.reverted) {
    console.error("Txn (Gas) reverted:", gasResult.revertReasons, gasResult.vmErrors)
    throw new Error(`Txn (Gas) reverted: ${JSON.stringify(gasResult?.revertReasons)}`)
  }

  const txBody = await thor.transactions.buildTransactionBody([clause], gasResult.totalGas)
  const signedTx = Transaction.of(txBody).sign(Buffer.from(privateKey, "hex"))
  const tx = await thor.transactions.sendTransaction(signedTx)
  const receipt = await thor.transactions.waitForTransaction(tx.id)

  return { receipt, gasResult }
}
