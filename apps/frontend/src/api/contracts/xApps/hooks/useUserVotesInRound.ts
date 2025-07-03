import { XAllocationVoting__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { getEventsKey, useEvents } from "@/hooks"
import { useQuery } from "@tanstack/react-query"

const abi = XAllocationVoting__factory.abi
const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const eventName = "AllocationVoteCast" as const

export type AllocationVoteCastEvent = {
  voter: string
  roundId: string
  appsIds: string[]
  voteWeights: string[]
}

export const getUserVotesInRoundQueryKey = (roundId: string, userAddress?: string) =>
  getEventsKey({
    eventName,
    filterParams: {
      voter: userAddress,
      roundId,
    },
  })

/**
 *  Hook to get the user votes in a given round from the xAllocationVoting contract
 * @returns the user votes in a given round from the xAllocationVoting contract
 */
export const useUserVotesInRound = (roundId: string, userAddress?: string) => {
  const { data, ...rest } = useEvents({
    abi,
    contractAddress: address,
    eventName,
    filterParams: {
      voter: userAddress,
      roundId,
    },
    mapResponse: data => {
      const { voter, roundId, appsIds, voteWeights } = data.decodedData.args

      return {
        voter,
        roundId: roundId.toString(),
        appsIds: [...appsIds],
        voteWeights: [...voteWeights].map(weight => weight.toString()),
      }
    },
  })

  const { data: singleVote, ...singleVoteRest } = useQuery({
    queryKey: ["userVotesInRound", roundId, userAddress],
    queryFn: () => {
      if (data!.length > 1) throw new Error("Multiple votes found")
      if (data!.length === 0) throw new Error("No votes found")

      return data![0]
    },
    enabled: !!userAddress && !!roundId && !!data && Array.isArray(data) && !rest.isLoading,
  })

  return {
    data: singleVote,
    ...rest,
    error: singleVoteRest.error,
    isError: singleVoteRest.isError,
  }
}
