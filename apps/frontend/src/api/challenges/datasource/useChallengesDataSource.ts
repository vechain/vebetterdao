import { getConfig } from "@repo/config"
import { useQueryClient } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useChallengesDeployBlock } from "@/hooks/useChallengesDeployBlock"

import { ChallengesDataSource } from "./ChallengesDataSource"
import { createEventsChallengesDataSource } from "./events/eventsDataSource"

/**
 * Returns the active ChallengesDataSource. Today this is the event-based impl;
 * swap here with `createIndexerChallengesDataSource()` when indexer endpoints land.
 */
export const useChallengesDataSource = (): ChallengesDataSource | null => {
  const thor = useThor()
  const queryClient = useQueryClient()
  const fromBlock = useChallengesDeployBlock()
  const { data: currentRoundRaw } = useCurrentAllocationsRoundId()
  const contractAddress = getConfig().challengesContractAddress

  const currentRound = currentRoundRaw !== undefined ? Number(currentRoundRaw) : undefined

  return useMemo(() => {
    if (!thor || currentRound === undefined) return null
    return createEventsChallengesDataSource({
      thor,
      queryClient,
      contractAddress,
      fromBlock,
      currentRound,
    })
  }, [thor, queryClient, contractAddress, fromBlock, currentRound])
}
