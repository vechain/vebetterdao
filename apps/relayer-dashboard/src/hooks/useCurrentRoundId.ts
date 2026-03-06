"use client"

import { useCallClause } from "@vechain/vechain-kit"

import { xAllocationAbi, xAllocationAddress } from "./contracts"

export function useCurrentRoundId() {
  return useCallClause({
    abi: xAllocationAbi,
    address: xAllocationAddress,
    method: "currentRoundId",
    args: [],
    queryOptions: { select: data => (data[0] != null ? Number(data[0]) : undefined) },
  })
}
