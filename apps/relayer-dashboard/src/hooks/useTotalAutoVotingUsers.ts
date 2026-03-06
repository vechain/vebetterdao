"use client"

import { useQuery } from "@tanstack/react-query"
import { useCallClause, useThor } from "@vechain/vechain-kit"

import { xAllocationAbi, xAllocationAddress } from "./contracts"

/**
 * Total auto-voting users at the latest block, read from XAllocationVoting.getTotalAutoVotingUsersAtTimepoint.
 */
export function useTotalAutoVotingUsers() {
  const thor = useThor()

  const bestBlock = useQuery({
    queryKey: ["bestBlockCompressed"],
    queryFn: () => thor.blocks.getBestBlockCompressed(),
    enabled: !!thor,
  })

  const blockNumber = bestBlock.data?.number

  const result = useCallClause({
    abi: xAllocationAbi,
    address: xAllocationAddress,
    method: "getTotalAutoVotingUsersAtTimepoint",
    args: [blockNumber ?? 0],
    queryOptions: {
      enabled: blockNumber != null,
      select: (data: readonly unknown[]) => (data[0] != null ? Number(data[0]) : undefined),
    },
  })

  return {
    totalUsers: result.data,
    isLoading: bestBlock.isLoading || result.isLoading,
  }
}
