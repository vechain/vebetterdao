import { useQuery } from "@tanstack/react-query"
import { useThor, ThorClient } from "@vechain/vechain-kit"

import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts/typechain-types"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress

/**
 *
 * Returns if a user has voted in a given roundId
 * @param thor  the thor client
 * @param roundId  the roundId the get state for
 * @param address  the address to check if they have voted
 * @returns if a user has voted in a given roundId
 */
export const getHasVotedInRound = async (thor: ThorClient, roundId?: string, address?: string): Promise<boolean> => {
  if (!roundId || !address) return false

  const res = await thor.contracts
    .load(XALLOCATIONVOTING_CONTRACT, XAllocationVoting__factory.abi)
    .read.hasVoted(roundId, address)

  if (!res) {
    throw new Error("Failed to check if user has voted in round")
  }

  return res[0] as boolean
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
  const thor = useThor()

  return useQuery({
    queryKey: getHasVotedInRoundQueryKey(roundId, address),
    queryFn: async () => await getHasVotedInRound(thor, roundId, address),
    enabled: !!thor && !!roundId && !!address,
  })
}
