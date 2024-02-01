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

/**
 * Params for getEvents function
 * @param thor the thor client
 * @param auctionId  the auction id to get the events
 * @param order  the order of the events (asc or desc)
 * @param offset  the offset of the events
 * @param limit  the limit of the events (max 256)
 * @param from  the block number to start from
 * @param filterCriteria  the filter criteria for the events
 * @returns  the encoded events
 */
export type GetEventsProps = {
  thor: Connex.Thor
  order?: "asc" | "desc"
  offset?: number
  limit?: number
  from?: number
  filterCriteria: Connex.Thor.Filter.Criteria<"event">[]
}
/**
 * Get events from blockchain (auction created, auction successful, auction cancelled)
 * @param order
 * @param offset
 * @param limit
 * @param from block parse start from
 */
export const getEvents = async ({
  thor,
  order = "asc",
  offset = 0,
  limit = 256,
  from = 0,
  filterCriteria,
}: GetEventsProps): Promise<Connex.Thor.Filter.Row<"event">[]> => {
  return await thor
    .filter("event", filterCriteria)
    .range({
      from,
      to: thor.status.head.number,
      unit: "block",
    })
    .order(order)
    .apply(offset, limit)
}
