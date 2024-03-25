/**
 * Poll the chain for a transaction receipt until it is found (or timeout after 3 blocks)
 * @param id Transaction id
 * @param blocksTimeout Number of blocks to wait before timeout
 * @returns  Transaction receipt
 */
export const pollForReceipt = async (
  thor: Connex.Thor,
  id?: string,
  blocksTimeout = 3,
): Promise<Connex.Thor.Transaction.Receipt> => {
  // uncomment to debug unknown status modal
  // throw new Error("debug unknown modal")

  if (!id) throw new Error("No transaction id provided")

  const transaction = thor.transaction(id)
  let receipt

  //Query the transaction until it has a receipt
  //Timeout after 3 blocks
  for (let i = 0; i < blocksTimeout; i++) {
    receipt = await transaction.getReceipt()
    if (receipt) {
      break
    }
    await thor.ticker().next()
  }

  if (!receipt) {
    throw new Error("Transaction receipt not found")
  }

  const transactionData = await transaction.get()

  if (!transactionData) throw Error("Failed to get TX data")

  return receipt
}
