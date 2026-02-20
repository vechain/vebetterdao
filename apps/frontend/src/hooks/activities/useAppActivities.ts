import { getConfig } from "@repo/config"
import { useMemo } from "react"

import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useEvents } from "@/hooks/useEvents"

import { ActivityItem, ActivityType } from "./types"

const contractAddress = getConfig().x2EarnAppsContractAddress

const appAddedAbi = [
  {
    type: "event",
    name: "AppAdded",
    inputs: [
      { name: "id", type: "bytes32", indexed: true },
      { name: "addr", type: "address", indexed: false },
      { name: "name", type: "string", indexed: false },
      { name: "appAvailableForAllocationVoting", type: "bool", indexed: false },
    ],
  },
] as const

const endorsementStatusAbi = [
  {
    type: "event",
    name: "AppEndorsementStatusUpdated",
    inputs: [
      { name: "appId", type: "bytes32", indexed: true },
      { name: "endorsed", type: "bool", indexed: false },
    ],
  },
] as const

const gracePeriodAbi = [
  {
    type: "event",
    name: "AppUnendorsedGracePeriodStarted",
    inputs: [
      { name: "appId", type: "bytes32", indexed: true },
      { name: "startBlock", type: "uint48", indexed: false },
      { name: "endBlock", type: "uint48", indexed: false },
    ],
  },
] as const

const blacklistAbi = [
  {
    type: "event",
    name: "BlacklistUpdated",
    inputs: [
      { name: "appId", type: "bytes32", indexed: true },
      { name: "isBlacklisted", type: "bool", indexed: false },
    ],
  },
] as const

export const useAppActivities = (currentRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const previousRoundId = currentRoundId && Number(currentRoundId) > 1 ? String(Number(currentRoundId) - 1) : undefined
  const { data: previousRound, isLoading: isPrevRoundLoading } = useAllocationsRound(previousRoundId)
  const { data: currentRound, isLoading: isCurrRoundLoading } = useAllocationsRound(currentRoundId)

  const appAddedEvents = useEvents({
    abi: appAddedAbi,
    contractAddress,
    eventName: "AppAdded",
    select: events =>
      events.map(e => ({
        appId: e.decodedData.args.id.toString(),
        name: e.decodedData.args.name,
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const endorsementEvents = useEvents({
    abi: endorsementStatusAbi,
    contractAddress,
    eventName: "AppEndorsementStatusUpdated",
    select: events =>
      events.map(e => ({
        appId: e.decodedData.args.appId.toString(),
        endorsed: e.decodedData.args.endorsed,
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const gracePeriodEvents = useEvents({
    abi: gracePeriodAbi,
    contractAddress,
    eventName: "AppUnendorsedGracePeriodStarted",
    select: events =>
      events.map(e => ({
        appId: e.decodedData.args.appId.toString(),
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const blacklistEvents = useEvents({
    abi: blacklistAbi,
    contractAddress,
    eventName: "BlacklistUpdated",
    select: events =>
      events.map(e => ({
        appId: e.decodedData.args.appId.toString(),
        isBlacklisted: e.decodedData.args.isBlacklisted,
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const data = useMemo((): ActivityItem[] => {
    if (!currentRoundId || currentRoundId === "0") return []

    const roundStartBlock = Number(previousRound?.voteEnd ?? 0)
    const roundEndBlock = Number(currentRound?.voteEnd ?? 0)
    if (!roundEndBlock) return []

    const isInRound = (blockNumber: number) => blockNumber >= roundStartBlock && blockNumber <= roundEndBlock

    const nameMap = new Map<string, string>()
    appAddedEvents.data?.forEach(e => nameMap.set(e.appId, e.name))

    const items: ActivityItem[] = []

    const newAppsRaw = (appAddedEvents.data ?? []).filter(e => isInRound(e.blockNumber))
    const seenIds = new Set<string>()
    const newApps = newAppsRaw.filter(e => {
      if (seenIds.has(e.appId)) return false
      seenIds.add(e.appId)
      return true
    })
    if (newApps.length > 0) {
      items.push({
        type: ActivityType.APP_NEW,
        date: Math.max(...newApps.map(e => e.timestamp)),
        roundId: currentRoundId,
        title: newApps.length === 1 ? "New app submitted" : `${newApps.length} new apps submitted`,
        metadata: { apps: newApps.map(e => ({ appId: e.appId, appName: e.name })) },
      })
    }

    const lostSeenIds = new Set<string>()
    const lost = (gracePeriodEvents.data ?? []).filter(e => {
      if (!isInRound(e.blockNumber) || lostSeenIds.has(e.appId)) return false
      lostSeenIds.add(e.appId)
      return true
    })
    if (lost.length > 0) {
      items.push({
        type: ActivityType.APP_ENDORSEMENT_LOST,
        date: Math.max(...lost.map(e => e.timestamp)),
        roundId: currentRoundId,
        title: lost.length === 1 ? "App lost endorsement" : `${lost.length} apps lost endorsement`,
        metadata: { apps: lost.map(e => ({ appId: e.appId, appName: nameMap.get(e.appId) ?? "" })) },
      })
    }

    const endorsedSeenIds = new Set<string>()
    const endorsed = (endorsementEvents.data ?? []).filter(e => {
      if (!isInRound(e.blockNumber) || !e.endorsed || endorsedSeenIds.has(e.appId)) return false
      endorsedSeenIds.add(e.appId)
      return true
    })
    if (endorsed.length > 0) {
      items.push({
        type: ActivityType.APP_ENDORSEMENT_REACHED,
        date: Math.max(...endorsed.map(e => e.timestamp)),
        roundId: currentRoundId,
        title: endorsed.length === 1 ? "App reached endorsement" : `${endorsed.length} apps reached endorsement`,
        metadata: { apps: endorsed.map(e => ({ appId: e.appId, appName: nameMap.get(e.appId) ?? "" })) },
      })
    }

    const bannedSeenIds = new Set<string>()
    const bannedApps = (blacklistEvents.data ?? []).filter(e => {
      if (!isInRound(e.blockNumber) || !e.isBlacklisted || bannedSeenIds.has(e.appId)) return false
      bannedSeenIds.add(e.appId)
      return true
    })
    if (bannedApps.length > 0) {
      items.push({
        type: ActivityType.APP_BANNED,
        date: Math.max(...bannedApps.map(e => e.timestamp)),
        roundId: currentRoundId,
        title: bannedApps.length === 1 ? "App banned" : `${bannedApps.length} apps banned`,
        metadata: { apps: bannedApps.map(e => ({ appId: e.appId, appName: nameMap.get(e.appId) ?? "" })) },
      })
    }

    return items
  }, [
    currentRoundId,
    previousRound?.voteEnd,
    currentRound?.voteEnd,
    appAddedEvents.data,
    gracePeriodEvents.data,
    endorsementEvents.data,
    blacklistEvents.data,
  ])

  return {
    data,
    isLoading:
      isPrevRoundLoading ||
      isCurrRoundLoading ||
      appAddedEvents.isLoading ||
      gracePeriodEvents.isLoading ||
      endorsementEvents.isLoading ||
      blacklistEvents.isLoading,
  }
}
