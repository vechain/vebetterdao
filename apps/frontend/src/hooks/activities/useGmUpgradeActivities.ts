import { getConfig } from "@repo/config"
import { useMemo } from "react"

import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useEvents } from "@/hooks/useEvents"
import { useTransactionOrigins } from "@/hooks/useTransactionOrigins"

import { ActivityItem, ActivityType } from "./types"

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

export const useGmUpgradeActivities = (currentRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const previousRoundId = currentRoundId && Number(currentRoundId) > 1 ? String(Number(currentRoundId) - 1) : undefined
  const { data: previousRound, isLoading: isPrevRoundLoading } = useAllocationsRound(previousRoundId)
  const { data: currentRound, isLoading: isCurrRoundLoading } = useAllocationsRound(currentRoundId)

  const upgradedEvents = useEvents({
    abi: upgradedAbi,
    contractAddress,
    eventName: "Upgraded",
    select: events =>
      events.map(e => ({
        tokenId: e.decodedData.args.tokenId.toString(),
        oldLevel: Number(e.decodedData.args.oldLevel),
        newLevel: Number(e.decodedData.args.newLevel),
        userAddress: e.meta.txOrigin ?? "",
        txID: e.meta.txID ?? "",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const txIdsToResolve = useMemo(() => {
    const events = upgradedEvents.data ?? []
    return Array.from(new Set(events.filter(e => !e.userAddress && e.txID).map(e => e.txID)))
  }, [upgradedEvents.data])

  const { data: txOriginByTxId, isLoading: isOriginsLoading } = useTransactionOrigins(txIdsToResolve)

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []

    const roundStartBlock = Number(previousRound?.voteEnd ?? 0)
    const roundEndBlock = Number(currentRound?.voteEnd ?? 0)
    if (!roundEndBlock) return []

    const isInRound = (blockNumber: number) => blockNumber >= roundStartBlock && blockNumber <= roundEndBlock

    const eventsInRound = (upgradedEvents.data ?? []).filter(e => isInRound(e.blockNumber))
    const raw = eventsInRound
      .map(e => ({
        ...e,
        userAddress: e.userAddress || txOriginByTxId[e.txID] || "",
      }))
      .filter(e => e.userAddress)

    if (raw.length === 0) return []

    const upgrades = raw.map(e => ({
      userAddress: e.userAddress,
      tokenId: e.tokenId,
      oldLevel: e.oldLevel,
      newLevel: e.newLevel,
      timestamp: e.timestamp,
    }))

    const date = Math.max(...upgrades.map(u => u.timestamp))

    return [
      {
        type: ActivityType.GM_UPGRADED,
        date,
        roundId: currentRoundId,
        title: raw.length === 1 ? "1 user upgraded their GM" : `${raw.length} users upgraded their GM`,
        metadata: { upgrades },
      },
    ]
  }, [currentRoundId, previousRound?.voteEnd, currentRound?.voteEnd, upgradedEvents.data, txOriginByTxId])

  return {
    data,
    isLoading: isPrevRoundLoading || isCurrRoundLoading || upgradedEvents.isLoading || isOriginsLoading,
  }
}
