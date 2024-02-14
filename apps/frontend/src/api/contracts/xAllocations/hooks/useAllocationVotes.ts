import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationVoting__factory } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *
 * Returns the number of votes for a given proposalId
 * @param thor  the thor client
 * @param proposalId  the proposalId the get state for
 * @returns the state of a given proposalId
 */
export const getAllocationVotes = async (thor: Connex.Thor, proposalId?: string): Promise<string> => {
  const functionFragment = XAllocationVoting__factory.createInterface().getFunction("totalVotes").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getAllocationVotesQueryKey = (proposalId?: string) => ["allocationsRound", "votes", proposalId]

/**
 *  Hook to get the number of votes for a given proposalId
 * @param proposalId  the proposalId the get the votes for
 * @returns  the number of votes for a given proposalId
 */
export const useAllocationVotes = (proposalId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationVotesQueryKey(proposalId),
    queryFn: async () => await getAllocationVotes(thor, proposalId),
    enabled: !!thor && !!proposalId,
  })
}
