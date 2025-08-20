import { XAllocationVoting__factory } from "@vechain-kit/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { decodeEventLog, useThor } from "@vechain/vechain-kit"

const abi = XAllocationVoting__factory.abi
const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const eventName = "AllocationVoteCast" as const

export type AllocationVoteCastEvent = {
  voter: string
  roundId: string
  appsIds: string[]
  voteWeights: string[]
}

export const getUserVotesInRoundQueryKey = (roundId: string, userAddress: string) => [
  "USER_VOTES",
  userAddress,
  roundId,
]

/**
 *  Hook to get the user votes in a given round from the xAllocationVoting contract
 * @returns the user votes in a given round from the xAllocationVoting contract
 */
export const useUserVotesInRound = (roundId: string, userAddress?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getUserVotesInRoundQueryKey(roundId, userAddress ?? ""),
    queryFn: async () => {
      const eventAbi = thor.contracts.load(address, abi).getEventAbi(eventName)
      const topics = eventAbi.encodeFilterTopicsNoNull({
        voter: userAddress,
        roundId,
      })

      const [eventLog] = await thor.logs.filterEventLogs({
        criteriaSet: [
          {
            criteria: {
              address,
              topic0: topics[0] ?? undefined,
              topic1: topics[1] ?? undefined,
              topic2: topics[2] ?? undefined,
            },
            eventAbi,
          },
        ],
        options: { limit: 1 },
      })

      if (!eventLog) return undefined

      const event = decodeEventLog(eventLog, abi)

      if (event.decodedData.eventName !== eventName) return undefined

      return {
        voter: event.decodedData.args.voter,
        roundId: event.decodedData.args.roundId.toString(),
        appsIds: [...event.decodedData.args.appsIds],
        voteWeights: [...event.decodedData.args.voteWeights].map(weight => weight.toString()),
      }
    },
    enabled: !!userAddress && !!roundId,
  })
}
