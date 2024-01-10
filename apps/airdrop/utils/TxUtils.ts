import { Recipient } from "../model/input"
import {
  Transaction,
  TransactionBody,
  TransactionClause,
  contract,
  networkInfo,
  TransactionHandler,
  unitsUtils,
} from "@vechainfoundation/vechain-sdk-core"
import { Poll, ThorClient, TransactionReceipt } from "@vechainfoundation/vechain-sdk-network"
import { addPrefix, generateRandom } from "@repo/utils/HexUtils"

export const buildMintB3trTx = async (
  thorClient: ThorClient,
  contractAddr: string,
  abi: any,
  recipients: Recipient[],
  caller: string,
  gasPriceCoef: number,
): Promise<Transaction> => {
  // 1 - Create the clauses
  const clauses: TransactionClause[] = []
  for (const recipient of recipients) {
    const clause = contract.clauseBuilder.functionInteraction(contractAddr, abi, "mint", [
      recipient.address,
      unitsUtils.parseUnits(recipient.amount, 18),
    ])
    clauses.push(clause)
  }

  // 2 - Calculate the gas
  const gas = await thorClient.gas.estimateGas(clauses, caller)
  if (gas.reverted) throw new Error("Failed to estimate gas")

  // 3 - Create Body
  const blockRef = await thorClient.blocks.getBestBlockRef()
  if (!blockRef) throw new Error("Failed to get block ref")
  const body: TransactionBody = {
    chainTag: networkInfo.solo.chainTag,
    blockRef,
    expiration: 32,
    clauses,
    gasPriceCoef,
    // TODO: Remove this buffer of 15_000 once the gas estimate calculation is fixed (https://github.com/vechainfoundation/vechain-sdk/issues/463)
    gas: gas.totalGas + 15_000,
    dependsOn: null,
    nonce: generateRandom(16),
  }

  return new Transaction(body)
}

export const signAndSendTx = async (
  thorClient: ThorClient,
  tx: Transaction,
  pk: Buffer,
): Promise<TransactionReceipt> => {
  const signed = TransactionHandler.sign(tx, pk)

  const res = await thorClient.transactions.sendRawTransaction(addPrefix(signed.encoded.toString("hex")))

  // Wait for the receipt
  const receipt = await Poll.SyncPoll(
    // Get the receipt of the transaction
    async () => await thorClient.transactions.getTransactionReceipt(res.id),
    // Polling interval is 3 seconds
    { requestIntervalInMilliseconds: 3000 },
  ).waitUntil(rec => {
    return rec !== null
  })

  if (!receipt) throw new Error("Failed to get tx receipt")

  return receipt
}
