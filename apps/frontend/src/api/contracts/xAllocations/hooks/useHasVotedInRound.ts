import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *
 * Returns if a user has voted in a given roundId
 * @param thor  the thor client
 * @param roundId  the roundId the get state for
 * @param address  the address to check if they have voted
 * @returns if a user has voted in a given roundId
 */
export const getHasVotedInRound = async (thor: Connex.Thor, roundId?: string, address?: string): Promise<boolean> => {
  const functionFragment = XAllocationVoting__factory.createInterface().getFunction("hasVoted").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(roundId, address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getHasVotedInRoundQueryKey = (roundId?: string, address?: string) => [
  "allocationsRound",
  roundId,
  "hasVoted",
  address,
]

/**
 *  Hook to get if a user has voted in a given roundId
 * @param roundId  the roundId the get the votes for
 * @param address  the address to check if they have voted
 * @returns  if a user has voted in a given roundId
 */
export const useHasVotedInRound = (roundId?: string, address?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getHasVotedInRoundQueryKey(roundId, address),
    queryFn: async () => await getHasVotedInRound(thor, roundId, address),
    enabled: !!thor && !!roundId && !!address,
  })
}
