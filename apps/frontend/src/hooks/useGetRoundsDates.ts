import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { executeCallClause, useThor } from "@vechain/vechain-kit"

import { getRoundsDates } from "@/app/allocations/history/page"

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

export const getRoundsDatesQueryKey = () => ["getRoundsDates"]

export const useGetRoundsDates = () => {
  const thor = useThor()

  return useQuery({
    queryKey: getRoundsDatesQueryKey(),
    queryFn: async () => {
      const [currentRound] = await executeCallClause({
        thor,
        abi: xAllocationVotingAbi,
        contractAddress: xAllocationVotingAddress,
        method: "currentRoundId" as const,
        args: [],
      })
      const currentRoundId = Number(currentRound)
      const roundIds = Array.from({ length: currentRoundId }, (_, idx) => currentRoundId - idx)
      return getRoundsDates(thor, roundIds)
    },
  })
}
