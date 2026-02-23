import { getConfig } from "@repo/config"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"

import { fetchContractEvents } from "@/api/contracts/governance/fetchContractEvents"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useContractDeployBlock } from "@/hooks/useContractDeployBlock"
import { useTransactionOrigins } from "@/hooks/useTransactionOrigins"

import type { GmUpgradeEntry } from "./useAllGmUpgrades"

const contractAddress = getConfig().galaxyMemberContractAddress

const upgradedAbi = [
  {
    type: "event",
    name: "Upgraded",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "oldLevel", type: "uint256", indexed: false },
      { name: "newLevel", type: "uint256", indexed: false },
    ],
  },
] as const

const PAGE_SIZE = 5
const BATCH_SIZE = 20

type RawEvent = {
  tokenId: string
  oldLevel: number
  newLevel: number
  userAddress: string
  txID: string
  timestamp: number
}

function rawToEntries(raw: RawEvent[], txOriginByTxId: Record<string, string>): GmUpgradeEntry[] {
  return raw
    .map(e => ({
      userAddress: e.userAddress || txOriginByTxId[e.txID] || "",
      tokenId: e.tokenId,
      oldLevel: e.oldLevel,
      newLevel: e.newLevel,
      timestamp: e.timestamp,
    }))
    .filter(e => e.userAddress)
}

export function useGmUpgradesPaginated() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const thor = useThor()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const previousRoundId = currentRoundId && Number(currentRoundId) > 1 ? String(Number(currentRoundId) - 1) : undefined
  const { data: previousRound } = useAllocationsRound(previousRoundId)
  const { data: currentRound } = useAllocationsRound(currentRoundId)
  const { data: deployBlock } = useContractDeployBlock(contractAddress)

  const roundStart = Number(previousRound?.voteEnd ?? 0)
  const roundEnd = Number(currentRound?.voteEnd ?? 0)
  const hasRound = roundEnd > 0 && roundStart >= 0

  const currentRoundQuery = useQuery({
    queryKey: ["gm-upgrades-current-round", roundStart, roundEnd],
    queryFn: async () => {
      const events = await fetchContractEvents({
        thor,
        abi: upgradedAbi,
        contractAddress,
        eventName: "Upgraded",
        from: Math.max(roundStart, deployBlock ?? 0),
        to: roundEnd,
        order: "desc",
        limit: BATCH_SIZE,
      })
      return events.map(e => ({
        tokenId: e.decodedData.args.tokenId.toString(),
        oldLevel: Number(e.decodedData.args.oldLevel),
        newLevel: Number(e.decodedData.args.newLevel),
        userAddress: e.meta.txOrigin ?? "",
        txID: e.meta.txID ?? "",
        timestamp: e.meta.blockTimestamp,
      }))
    },
    enabled: !!thor && hasRound && deployBlock !== undefined,
    staleTime: 5 * 60 * 1000,
  })

  const currentLength = currentRoundQuery.data?.length ?? 0
  const previousBatchesNeeded = hasRound
    ? Math.max(0, Math.ceil(Math.max(0, visibleCount - currentLength) / BATCH_SIZE))
    : 0
  const noCurrentData = hasRound && currentRoundQuery.isSuccess && currentLength === 0
  const shouldFetchPrevious = (previousBatchesNeeded > 0 || noCurrentData) && roundStart > 0

  const previousBatchQueries = useQueries({
    queries: Array.from({ length: shouldFetchPrevious ? Math.max(1, previousBatchesNeeded) : 0 }, (_, i) => ({
      queryKey: ["gm-upgrades-before-round", roundStart, deployBlock, i] as const,
      queryFn: async () => {
        const events = await fetchContractEvents({
          thor,
          abi: upgradedAbi,
          contractAddress,
          eventName: "Upgraded",
          from: deployBlock ?? 0,
          to: roundStart - 1,
          order: "desc",
          offset: i * BATCH_SIZE,
          limit: BATCH_SIZE,
        })
        return events.map(e => ({
          tokenId: e.decodedData.args.tokenId.toString(),
          oldLevel: Number(e.decodedData.args.oldLevel),
          newLevel: Number(e.decodedData.args.newLevel),
          userAddress: e.meta.txOrigin ?? "",
          txID: e.meta.txID ?? "",
          timestamp: e.meta.blockTimestamp,
        }))
      },
      enabled: !!thor && deployBlock !== undefined && roundStart > 0,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const fallbackBatchesNeeded = !hasRound ? Math.max(1, Math.ceil(visibleCount / BATCH_SIZE)) : 0

  const fallbackQueries = useQueries({
    queries: Array.from({ length: fallbackBatchesNeeded }, (_, i) => ({
      queryKey: ["gm-upgrades-recent", deployBlock, i] as const,
      queryFn: async () => {
        const events = await fetchContractEvents({
          thor,
          abi: upgradedAbi,
          contractAddress,
          eventName: "Upgraded",
          from: deployBlock ?? 0,
          order: "desc",
          offset: i * BATCH_SIZE,
          limit: BATCH_SIZE,
        })
        return events.map(e => ({
          tokenId: e.decodedData.args.tokenId.toString(),
          oldLevel: Number(e.decodedData.args.oldLevel),
          newLevel: Number(e.decodedData.args.newLevel),
          userAddress: e.meta.txOrigin ?? "",
          txID: e.meta.txID ?? "",
          timestamp: e.meta.blockTimestamp,
        }))
      },
      enabled: !!thor && !hasRound && deployBlock !== undefined,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const rawPreviousBatches = useMemo(() => {
    return previousBatchQueries.filter(q => q.data != null).flatMap(q => q.data!)
  }, [previousBatchQueries])

  const rawFallbackBatches = useMemo(() => {
    return fallbackQueries.filter(q => q.data != null).flatMap(q => q.data!)
  }, [fallbackQueries])

  const allRaw = useMemo(() => {
    const rawCurrent = currentRoundQuery.data ?? []
    const fromCurrent = hasRound ? rawCurrent : []
    const beforeRound = hasRound ? rawPreviousBatches : rawFallbackBatches
    return [...fromCurrent, ...beforeRound]
  }, [hasRound, currentRoundQuery.data, rawPreviousBatches, rawFallbackBatches])

  const txIdsToResolve = useMemo(
    () => Array.from(new Set(allRaw.filter(e => !e.userAddress && e.txID).map(e => e.txID))),
    [allRaw],
  )

  const { data: txOriginByTxId, isLoading: isOriginsLoading } = useTransactionOrigins(txIdsToResolve)

  const allEntries = useMemo(() => rawToEntries(allRaw, txOriginByTxId ?? {}), [allRaw, txOriginByTxId])

  const visibleData = useMemo(() => allEntries.slice(0, visibleCount), [allEntries, visibleCount])

  const lastPreviousBatchFull =
    previousBatchQueries.length > 0 &&
    (previousBatchQueries[previousBatchQueries.length - 1]?.data?.length ?? 0) === BATCH_SIZE
  const lastFallbackBatchFull =
    fallbackQueries.length > 0 && (fallbackQueries[fallbackQueries.length - 1]?.data?.length ?? 0) === BATCH_SIZE
  const hasMore =
    visibleCount < allEntries.length ||
    (shouldFetchPrevious && lastPreviousBatchFull) ||
    (!hasRound && lastFallbackBatchFull)
  const previousQueriesLoading = previousBatchQueries.some(q => q.isLoading)
  const fallbackQueriesLoading = fallbackQueries.some(q => q.isLoading)
  const isLoading =
    currentRoundQuery.isLoading ||
    (shouldFetchPrevious ? previousQueriesLoading : false) ||
    (!hasRound ? fallbackQueriesLoading : false) ||
    isOriginsLoading

  const loadMore = useCallback(() => {
    setVisibleCount(c => c + PAGE_SIZE)
  }, [])

  return {
    data: visibleData,
    allCount: allEntries.length,
    hasMore,
    loadMore,
    isLoading,
  }
}
