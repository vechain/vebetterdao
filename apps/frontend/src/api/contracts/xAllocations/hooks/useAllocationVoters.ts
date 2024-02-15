import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *
 * Returns the number of voters for a given roundId
 * @param thor  the thor client
 * @param roundId  the roundId the get state for
 * @returns the number of voters for a given roundId
 */
export const getAllocationVoters = async (thor: Connex.Thor, roundId?: string): Promise<string> => {
  const functionFragment = XAllocationVoting__factory.createInterface().getFunction("totalVoters").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAllocationVotersQueryKey = (roundId?: string) => ["allocationsRound", "voters", roundId]

/**
 *  Hook to get the number of votes for a given roundId
 * @param roundId  the roundId the get the votes for
 * @returns  the number of votes for a given roundId
 */
export const useAllocationVoters = (roundId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationVotersQueryKey(roundId),
    queryFn: async () => await getAllocationVoters(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
