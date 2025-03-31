// Getter for obtaining appIds of a given round

import { getConfig } from "@repo/config"
import { XAllocationVoting__factory as XAllocationVoting } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress
const xAllocationsInterface = XAllocationVoting.createInterface()

/**
 * Get the appIds participating in allocations for a given round
 * @param thor - The thor client
 * @param roundId - The roundId
 * @returns The appIds of the given round
 */
export const getAppIdsOfRound = async (thor: Connex.Thor, roundId?: string): Promise<string[] | undefined> => {
  if (!roundId) return

  const functionFragment = xAllocationsInterface.getFunction("getAppIdsOfRound").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}
