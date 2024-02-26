import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { XAllocationVotingGovernorJson } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

export const RoundState = {
  "0": "Active",
  "1": "Quorum failed",
  "2": "Succeeded",
}
/**
 *
 * Returns the state of a given roundId
 * @param thor  the thor client
 * @param roundId  the roundId the get state for
 * @returns the state of a given roundId
 */
export const getAllocationsRoundState = async (
  thor: Connex.Thor,
  roundId?: string,
): Promise<keyof typeof RoundState> => {
  if (!roundId) return Promise.reject(new Error("roundId is required"))
  const allocationRoundStateAbi = XAllocationVotingGovernorJson.abi.find(abi => abi.name === "state")
  if (!allocationRoundStateAbi) throw new Error("state function not found")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(allocationRoundStateAbi).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAllocationsRoundStateQueryKey = (roundId?: string) => ["allocationsRoundState", roundId]

/**
 * Hook to get the state of a given roundId
 * @param roundId  the roundId the get state for
 * @returns  the state of a given roundId
 */
export const useAllocationsRoundState = (roundId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationsRoundStateQueryKey(roundId),
    queryFn: async () => await getAllocationsRoundState(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
