import { TransactionHandler, networkInfo, type TransactionClause, type TransactionBody } from "@vechain/sdk-core"
import { HttpClient, ThorClient } from "@vechain/sdk-network"

const thorNetwork = new HttpClient("http://localhost:8669")
const thorClient = new ThorClient(thorNetwork)

export const getBestBlockRef = async (): Promise<string> => {
  const blockRef = await thorClient.blocks.getBestBlockRef()

  if (!blockRef) {
    throw new Error("Block ref not found")
  }

  return blockRef
}

export const buildTxBody = async (
  clauses: TransactionClause[],
  senderAddress: string,
  expiration: number,
  gas?: number,
): Promise<TransactionBody> => {
  if (!gas) {
    // Get gas estimate
    const gasResult = await thorClient.gas.estimateGas(clauses, senderAddress)

    if (gasResult.reverted) {
      throw new Error(`Gas estimation failed: ${gasResult.revertReasons}`)
    }

    gas = gasResult.totalGas + 200_000
  }

  const body: TransactionBody = {
    chainTag: networkInfo.solo.chainTag,
    blockRef: await getBestBlockRef(),
    expiration,
    clauses,
    gasPriceCoef: 0,
    gas,
    dependsOn: null,
    nonce: Math.floor(Math.random() * 10000000),
  }

  return body
}

export const signAndSendTx = async (body: TransactionBody, pk: Buffer) => {
  const signedTx = TransactionHandler.sign(body, pk)

  const sendTransactionResult = await thorClient.transactions.sendTransaction(signedTx)

  const txReceipt = await thorClient.transactions.waitForTransaction(sendTransactionResult.id)

  if (!txReceipt) {
    throw new Error("Transaction failed")
  }
  if (txReceipt.reverted) {
    throw new Error("Transaction reverted")
  }
}
