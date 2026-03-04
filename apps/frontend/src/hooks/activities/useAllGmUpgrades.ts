import { getConfig } from "@repo/config"
import { useMemo } from "react"

import { useEvents } from "@/hooks/useEvents"
import { useTransactionOrigins } from "@/hooks/useTransactionOrigins"

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

export type GmUpgradeEntry = {
  userAddress: string
  tokenId: string
  oldLevel: number
  newLevel: number
  timestamp: number
}

const RECENT_UPGRADES_LIMIT = 50

export const useAllGmUpgrades = (): { data: GmUpgradeEntry[]; isLoading: boolean } => {
  const upgradedEvents = useEvents({
    abi: upgradedAbi,
    contractAddress,
    eventName: "Upgraded",
    order: "desc",
    limit: RECENT_UPGRADES_LIMIT,
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

  const data = useMemo((): GmUpgradeEntry[] => {
    const events = upgradedEvents.data ?? []
    return events
      .map(e => ({
        userAddress: e.userAddress || txOriginByTxId[e.txID] || "",
        tokenId: e.tokenId,
        oldLevel: e.oldLevel,
        newLevel: e.newLevel,
        timestamp: e.timestamp,
      }))
      .filter(e => e.userAddress)
  }, [upgradedEvents.data, txOriginByTxId])

  return {
    data,
    isLoading: upgradedEvents.isLoading || isOriginsLoading,
  }
}
