import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"

import { getEventsKey, useEvents } from "../../../../hooks/useEvents"

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`
const eventName = "AllocationVoteCast" as const
export const getUserVotesInAllRoundsQueryKey = (address?: string) =>
  getEventsKey({
    eventName,
    filterParams: {
      voter: address,
    },
  })
/**
 * useUserVotes is a custom hook that fetches the votes of a user for all rounds up to the current one.
 * @param currentRound - The id of the current round.
 * @param address - The address of the user.
 * @returns An object containing the status and data of the queries for each round.
 */
export const useUserVotesInAllRounds = (address?: string) => {
  return useEvents({
    abi,
    contractAddress,
    eventName,
    filterParams: { voter: address },
    select: events =>
      events.map(({ decodedData }) => {
        const { voter, roundId, appsIds, voteWeights } = decodedData.args
        return {
          voter,
          roundId: roundId.toString(),
          appsIds: [...appsIds],
          voteWeights: [...voteWeights].map(weight => weight.toString()),
        }
      }),
    enabled: !!address,
  })
}
