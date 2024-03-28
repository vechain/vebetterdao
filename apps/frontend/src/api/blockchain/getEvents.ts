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

/**
 *  call getEvents iteratively to get all the events
 * @param thor the thor client
 * @param order the order of the events (asc or desc)
 * @param from the block number to start from
 * @param filterCriteria the filter criteria for the events
 * @returns all the events from the blockchain
 */
export const getAllEvents = async ({
  thor,
  order = "asc",
  from = 0,
  filterCriteria,
}: Omit<GetEventsProps, "offset" | "limit">) => {
  const allEvents: Connex.Thor.Filter.Row<"event", {}>[] = []
  let offset = 0
  //return from the function only when we get all the events
  while (true) {
    const events = await getEvents({
      thor,
      filterCriteria,
      from,
      limit: 256,
      order,
      offset,
    })
    allEvents.push(...events)
    if (events.length < 256) {
      return allEvents
    }
    offset += 256
  }
}
