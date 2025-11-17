import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { executeCallClause, executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

import { blockNumberToDate } from "@/utils/date"

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

export const getRoundsDatesQueryKey = () => ["getRoundsDates"]

export const useGetRoundsDates = () => {
  const thor = useThor()

  return useQuery({
    queryKey: getRoundsDatesQueryKey(),
    queryFn: async () => {
      const [currentRound] = await executeCallClause({
        thor,
        abi,
        contractAddress,
        method: "currentRoundId" as const,
        args: [],
      })
      const currentRoundId = Number(currentRound)
      const roundsArray = Array(currentRoundId)
        .fill(null)
        .map((_, idx) => currentRoundId - idx)

      const bestBlockCompressed = await thor.blocks.getBestBlockCompressed()
      const rounds = await executeMultipleClausesCall({
        thor,
        calls: roundsArray.map(
          round =>
            ({
              abi,
              address: contractAddress,
              functionName: "getRound" as const,
              args: [BigInt(round)],
            }) as const,
        ),
      })

      return new Map(
        rounds.map((round, idx) => {
          const startBlock = round.voteStart
          const endBlock = round.voteStart + round.voteDuration

          return [
            roundsArray[idx],
            {
              startDate: blockNumberToDate(BigInt(startBlock), bestBlockCompressed),
              endDate: blockNumberToDate(BigInt(endBlock), bestBlockCompressed),
            },
          ]
        }),
      )
    },
  })
}
