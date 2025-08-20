import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain-kit/vebetterdao-contracts"
import { formatEther } from "viem"

const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const abi = XAllocationVoting__factory.abi
const method = "roundQuorum" as const

/**
 * Returns the query key for fetching the allocation round quorum.
 * @param roundId The round ID to get the quorum for
 * @returns The query key for fetching the allocation round quorum.
 */
export const getAllocationRoundQuorumQueryKey = (roundId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(roundId)] })

/**
 * Hook to get the quorum that needs to be reached for an allocation round
 * @param roundId The round ID to get the quorum for
 * @returns amount of votes needed to reach quorum
 */
export const useAllocationRoundQuorum = (roundId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId)],
    queryOptions: {
      enabled: !!roundId,
      select: data => formatEther(BigInt(data[0])),
    },
  })
}
