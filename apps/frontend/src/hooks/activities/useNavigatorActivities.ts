import { getConfig } from "@repo/config"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useGetRawNavigatorAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetRawNavigatorAtTimepoint"
import { useAllocationRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useAllocationRoundSnapshot"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useEvents } from "@/hooks/useEvents"

import { ActivityItem, ActivityType } from "./types"

const contractAddress = getConfig().navigatorRegistryContractAddress

const navigatorRegisteredAbi = [
  {
    type: "event",
    name: "NavigatorRegistered",
    inputs: [
      { name: "navigator", type: "address", indexed: true },
      { name: "stakeAmount", type: "uint256", indexed: false },
      { name: "metadataURI", type: "string", indexed: false },
    ],
  },
] as const

const exitAnnouncedAbi = [
  {
    type: "event",
    name: "ExitAnnounced",
    inputs: [
      { name: "navigator", type: "address", indexed: true },
      { name: "announcedAtRound", type: "uint256", indexed: false },
      { name: "effectiveDeadline", type: "uint256", indexed: false },
    ],
  },
] as const

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

export const useNavigatorActivities = (currentRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const { account } = useWallet()
  const previousRoundId = currentRoundId && Number(currentRoundId) > 1 ? String(Number(currentRoundId) - 1) : undefined
  const { data: previousRound, isLoading: isPrevRoundLoading } = useAllocationsRound(previousRoundId)
  const { data: currentRound, isLoading: isCurrRoundLoading } = useAllocationsRound(currentRoundId)

  const { data: snapshotBlock, isLoading: isSnapshotLoading } = useAllocationRoundSnapshot(currentRoundId ?? "0")

  const { data: userNavigatorAddress, isLoading: isRawNavLoading } = useGetRawNavigatorAtTimepoint(
    account?.address,
    snapshotBlock,
  )

  const registeredEvents = useEvents({
    abi: navigatorRegisteredAbi,
    contractAddress,
    eventName: "NavigatorRegistered",
    enabled: !!contractAddress,
    select: events =>
      events.map(e => ({
        navigator: e.decodedData.args.navigator as string,
        stakeAmount: e.decodedData.args.stakeAmount.toString(),
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })),
  })

  const exitAnnouncedEvents = useEvents({
    abi: exitAnnouncedAbi,
    contractAddress,
    eventName: "ExitAnnounced",
    enabled: !!contractAddress,
    select: events =>
      events.map(e => ({
        navigator: e.decodedData.args.navigator as string,
        announcedAtRound: e.decodedData.args.announcedAtRound.toString(),
        effectiveDeadline: e.decodedData.args.effectiveDeadline.toString(),
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

    const items: ActivityItem[] = []

    // --- Global: new navigators joined ---
    const seenRegistered = new Set<string>()
    const joined = (registeredEvents.data ?? []).filter(e => {
      if (!isInRound(e.blockNumber) || seenRegistered.has(e.navigator)) return false
      seenRegistered.add(e.navigator)
      return true
    })
    if (joined.length > 0) {
      const totalStake = joined.reduce((sum, e) => sum + BigInt(e.stakeAmount), 0n).toString()
      items.push({
        type: ActivityType.NAVIGATOR_JOINED,
        date: Math.max(...joined.map(e => e.timestamp)),
        roundId: currentRoundId,
        title:
          joined.length === 1 ? "1 new navigator joined VeBetter" : `${joined.length} new navigators joined VeBetter`,
        metadata: {
          count: joined.length,
          navigators: joined.map(e => ({ address: e.navigator })),
          totalStake,
        },
      })
    }

    // --- Global: navigators announced exit ---
    const seenAnnounced = new Set<string>()
    const announced = (exitAnnouncedEvents.data ?? []).filter(e => {
      if (!isInRound(e.blockNumber) || seenAnnounced.has(e.navigator)) return false
      seenAnnounced.add(e.navigator)
      return true
    })
    if (announced.length > 0) {
      items.push({
        type: ActivityType.NAVIGATOR_EXIT_ANNOUNCED,
        date: Math.max(...announced.map(e => e.timestamp)),
        roundId: currentRoundId,
        title: announced.length === 1 ? "1 navigator announced exit" : `${announced.length} navigators announced exit`,
        metadata: {
          count: announced.length,
          navigators: announced.map(e => ({ address: e.navigator })),
          effectiveDeadlineRoundId: announced[0]?.effectiveDeadline,
        },
      })
    }

    // --- Global: navigators exited (effectiveDeadline matches this round) ---
    const seenExited = new Set<string>()
    const exited = (exitAnnouncedEvents.data ?? []).filter(e => {
      if (e.effectiveDeadline !== currentRoundId || seenExited.has(e.navigator)) return false
      seenExited.add(e.navigator)
      return true
    })
    if (exited.length > 0) {
      items.push({
        type: ActivityType.NAVIGATOR_EXITED,
        date: Math.max(...exited.map(e => e.timestamp)),
        roundId: currentRoundId,
        title: exited.length === 1 ? "1 navigator exited" : `${exited.length} navigators exited`,
        metadata: {
          count: exited.length,
          navigators: exited.map(e => ({ address: e.navigator })),
        },
      })
    }

    // --- Personal: user's navigator announced exit / exited ---
    if (account?.address && userNavigatorAddress && userNavigatorAddress !== ZERO_ADDRESS) {
      const navExitEvents = (exitAnnouncedEvents.data ?? []).filter(
        e => e.navigator.toLowerCase() === userNavigatorAddress.toLowerCase(),
      )

      const announcedInRound = navExitEvents.find(e => e.announcedAtRound === currentRoundId)
      if (announcedInRound) {
        items.push({
          type: ActivityType.USER_NAVIGATOR_EXIT_ANNOUNCED,
          date: announcedInRound.timestamp,
          roundId: currentRoundId,
          title: "Your navigator announced exit",
          metadata: {
            navigatorAddress: userNavigatorAddress,
            effectiveDeadlineRoundId: announcedInRound.effectiveDeadline,
          },
        })
      }

      const exitedInRound = navExitEvents.find(e => e.effectiveDeadline === currentRoundId)
      if (exitedInRound) {
        items.push({
          type: ActivityType.USER_NAVIGATOR_EXITED,
          date: exitedInRound.timestamp,
          roundId: currentRoundId,
          title: "Your navigator exited",
          metadata: { navigatorAddress: userNavigatorAddress },
        })
      }
    }

    return items
  }, [
    currentRoundId,
    previousRound?.voteEnd,
    currentRound?.voteEnd,
    registeredEvents.data,
    exitAnnouncedEvents.data,
    account?.address,
    userNavigatorAddress,
  ])

  return {
    data,
    isLoading:
      isPrevRoundLoading ||
      isCurrRoundLoading ||
      isSnapshotLoading ||
      isRawNavLoading ||
      registeredEvents.isLoading ||
      exitAnnouncedEvents.isLoading,
  }
}
