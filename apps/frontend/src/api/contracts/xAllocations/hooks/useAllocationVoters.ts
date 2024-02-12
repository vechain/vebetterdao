import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { XAllocationVoting__factory as XAllocationVoting } from "@repo/contracts/typechain-types"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *
 * Returns the number of voters for a given proposalId
 * @param thor  the thor client
 * @param proposalId  the proposalId the get state for
 * @returns the number of voters for a given proposalId
 */
export const getAllocationVoters = async (thor: Connex.Thor, proposalId?: string): Promise<string> => {
  const functionFragment = XAllocationVoting.createInterface().getFunction("totalVoters").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAllocationVotersQueryKey = (proposalId?: string) => ["allocationsRound", "voters", proposalId]

/**
 *  Hook to get the number of votes for a given proposalId
 * @param proposalId  the proposalId the get the votes for
 * @returns  the number of votes for a given proposalId
 */
export const useAllocationVoters = (proposalId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationVotersQueryKey(proposalId),
    queryFn: async () => await getAllocationVoters(thor, proposalId),
    enabled: !!thor && !!proposalId,
  })
}
