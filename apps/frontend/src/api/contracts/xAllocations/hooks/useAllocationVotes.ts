import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "totalVotes" as const
/**
 * Returns the query key for fetching the allocation votes.
 * @param roundId The round ID to get the votes for
 * @returns The query key for fetching the allocation votes.
 */
export const getAllocationVotesQueryKey = (roundId?: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(roundId || 0)] })
/**
 * Hook to get the number of votes for a given roundId
 * @param roundId The roundId to get the votes for
 * @returns the number of votes for a given roundId
 */
export const useAllocationVotes = (roundId?: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId || 0)],
    queryOptions: {
      enabled: !!roundId,
      select: data => formatEther(BigInt(data[0])),
    },
  })
}
