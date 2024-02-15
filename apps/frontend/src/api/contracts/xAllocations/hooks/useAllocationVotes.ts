import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationVoting__factory } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *
 * Returns the number of votes for a given roundId
 * @param thor  the thor client
 * @param roundId  the roundId the get state for
 * @returns the state of a given roundId
 */
export const getAllocationVotes = async (thor: Connex.Thor, roundId?: string): Promise<string> => {
  const functionFragment = XAllocationVoting__factory.createInterface().getFunction("totalVotes").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getAllocationVotesQueryKey = (roundId?: string) => ["allocationsRound", "votes", roundId]

/**
 *  Hook to get the number of votes for a given roundId
 * @param roundId  the roundId the get the votes for
 * @returns  the number of votes for a given roundId
 */
export const useAllocationVotes = (roundId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationVotesQueryKey(roundId),
    queryFn: async () => await getAllocationVotes(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
