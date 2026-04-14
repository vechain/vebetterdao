import { getConfig } from "@repo/config"
import type { QueryClient } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { formatEther } from "ethers"
import { useMemo } from "react"

import { useEvents } from "@/hooks/useEvents"

const address = getConfig().navigatorRegistryContractAddress
const abi = NavigatorRegistry__factory.abi

export type StakeHistoryEntry = {
  type: "registered" | "deposit" | "withdrawal" | "slashed"
  navigator: string
  amount: string
  newTotal: string
  blockNumber: number
  txId: string
  timestamp: number
  reason?: string
  roundId?: string
  infractionFlags?: number
}

const STAKE_HISTORY_EVENT_NAMES = [
  "NavigatorRegistered",
  "StakeAdded",
  "StakeWithdrawn",
  "NavigatorSlashed",
  "NavigatorMinorSlashed",
] as const

/** Prefix-invalidates `useEvents` queries merged by `useNavigatorStakeHistory` */
export const invalidateNavigatorStakeHistoryQueries = (queryClient: QueryClient) => {
  for (const eventName of STAKE_HISTORY_EVENT_NAMES) {
    void queryClient.invalidateQueries({ queryKey: [eventName] })
  }
}

export const useNavigatorStakeHistory = (navigator?: string) => {
  const filterParams = navigator ? { navigator: navigator as `0x${string}` } : undefined

  const registeredEvents = useEvents({
    contractAddress: address,
    abi,
    eventName: "NavigatorRegistered",
    filterParams,
    order: "desc",
    select: events =>
      events.map(({ decodedData, meta }) => ({
        type: "registered" as const,
        navigator: String(decodedData.args.navigator ?? ""),
        amount: formatEther(decodedData.args.stakeAmount ?? 0n),
        newTotal: formatEther(decodedData.args.stakeAmount ?? 0n),
        blockNumber: meta.blockNumber,
        txId: meta.txID,
        timestamp: meta.blockTimestamp,
      })),
  })

  const addedEvents = useEvents({
    contractAddress: address,
    abi,
    eventName: "StakeAdded",
    filterParams,
    order: "desc",
    select: events =>
      events.map(({ decodedData, meta }) => ({
        type: "deposit" as const,
        navigator: String(decodedData.args.navigator ?? ""),
        amount: formatEther(decodedData.args.amount ?? 0n),
        newTotal: formatEther(decodedData.args.newTotal ?? 0n),
        blockNumber: meta.blockNumber,
        txId: meta.txID,
        timestamp: meta.blockTimestamp,
      })),
  })

  const withdrawnEvents = useEvents({
    contractAddress: address,
    abi,
    eventName: "StakeWithdrawn",
    filterParams,
    order: "desc",
    select: events =>
      events.map(({ decodedData, meta }) => ({
        type: "withdrawal" as const,
        navigator: String(decodedData.args.navigator ?? ""),
        amount: formatEther(decodedData.args.amount ?? 0n),
        newTotal: formatEther(decodedData.args.remaining ?? 0n),
        blockNumber: meta.blockNumber,
        txId: meta.txID,
        timestamp: meta.blockTimestamp,
      })),
  })

  const slashedEvents = useEvents({
    contractAddress: address,
    abi,
    eventName: "NavigatorSlashed",
    filterParams,
    order: "desc",
    select: events =>
      events.map(({ decodedData, meta }) => ({
        type: "slashed" as const,
        navigator: String(decodedData.args.navigator ?? ""),
        amount: formatEther(decodedData.args.amount ?? 0n),
        newTotal: formatEther(decodedData.args.remainingStake ?? 0n),
        blockNumber: meta.blockNumber,
        txId: meta.txID,
        timestamp: meta.blockTimestamp,
        reason: String(decodedData.args.reason ?? ""),
      })),
  })

  const minorSlashedEvents = useEvents({
    contractAddress: address,
    abi,
    eventName: "NavigatorMinorSlashed",
    filterParams,
    order: "desc",
    select: events =>
      events.map(({ decodedData, meta }) => ({
        type: "slashed" as const,
        navigator: String(decodedData.args.navigator ?? ""),
        amount: formatEther(decodedData.args.amount ?? 0n),
        newTotal: formatEther(decodedData.args.remainingStake ?? 0n),
        blockNumber: meta.blockNumber,
        txId: meta.txID,
        timestamp: meta.blockTimestamp,
        reason: `Round #${String(decodedData.args.roundId ?? "")}`,
        roundId: String(decodedData.args.roundId ?? ""),
        infractionFlags: Number(decodedData.args.infractionFlags ?? 0n),
      })),
  })

  const isLoading =
    registeredEvents.isLoading ||
    addedEvents.isLoading ||
    withdrawnEvents.isLoading ||
    slashedEvents.isLoading ||
    minorSlashedEvents.isLoading

  const data = useMemo(() => {
    const all: StakeHistoryEntry[] = [
      ...(registeredEvents.data ?? []),
      ...(addedEvents.data ?? []),
      ...(withdrawnEvents.data ?? []),
      ...(slashedEvents.data ?? []),
      ...(minorSlashedEvents.data ?? []),
    ]
    return all.sort((a, b) => b.blockNumber - a.blockNumber)
  }, [registeredEvents.data, addedEvents.data, withdrawnEvents.data, slashedEvents.data, minorSlashedEvents.data])

  return { data, isLoading }
}
