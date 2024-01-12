import { Recipient } from "../model/input"
import {
  Transaction,
  TransactionBody,
  TransactionClause,
  contract,
  networkInfo,
  TransactionHandler,
  unitsUtils,
} from "@vechain/vechain-sdk-core"
import { ThorClient, TransactionReceipt } from "@vechain/vechain-sdk-network"
import B3tr from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
import { addPrefix, generateRandom } from "@repo/utils/HexUtils"
import { Type } from "../model/env"

const abi = B3tr.abi
if (!abi) throw new Error("ABI not found for B3TR contract")

export const buildTx = async (
  thorClient: ThorClient,
  contractAddr: string,
  type: Type,
  recipients: Recipient[],
  caller: string,
  gasPriceCoef: number,
): Promise<Transaction> => {
  // 1 - Create the clauses
  const clauses: TransactionClause[] = []
  for (const recipient of recipients) {
    const clause = contract.clauseBuilder.functionInteraction(contractAddr, abi, type, [
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
    gas: gas.totalGas,
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
  const receipt = await thorClient.transactions.waitForTransaction(res.id)

  if (!receipt) throw new Error("Failed to get tx receipt")

  return receipt
}
