import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { formatEther } from "ethers"
import { useMemo } from "react"

import { useEvents } from "@/hooks/useEvents"

const address = getConfig().navigatorRegistryContractAddress
const abi = NavigatorRegistry__factory.abi

export type StakeHistoryEntry = {
  type: "registered" | "deposit" | "withdrawal"
  amount: string
  newTotal: string
  blockNumber: number
  txId: string
  timestamp: number
}

export const useNavigatorStakeHistory = (navigator: string) => {
  const registeredEvents = useEvents({
    contractAddress: address,
    abi,
    eventName: "NavigatorRegistered",
    filterParams: { navigator: navigator as `0x${string}` },
    enabled: !!navigator,
    order: "desc",
    select: events =>
      events.map(({ decodedData, meta }) => ({
        type: "registered" as const,
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
    filterParams: { navigator: navigator as `0x${string}` },
    enabled: !!navigator,
    order: "desc",
    select: events =>
      events.map(({ decodedData, meta }) => ({
        type: "deposit" as const,
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
    filterParams: { navigator: navigator as `0x${string}` },
    enabled: !!navigator,
    order: "desc",
    select: events =>
      events.map(({ decodedData, meta }) => ({
        type: "withdrawal" as const,
        amount: formatEther(decodedData.args.amount ?? 0n),
        newTotal: formatEther(decodedData.args.remaining ?? 0n),
        blockNumber: meta.blockNumber,
        txId: meta.txID,
        timestamp: meta.blockTimestamp,
      })),
  })

  const isLoading = registeredEvents.isLoading || addedEvents.isLoading || withdrawnEvents.isLoading

  const data = useMemo(() => {
    const all: StakeHistoryEntry[] = [
      ...(registeredEvents.data ?? []),
      ...(addedEvents.data ?? []),
      ...(withdrawnEvents.data ?? []),
    ]
    return all.sort((a, b) => b.blockNumber - a.blockNumber)
  }, [registeredEvents.data, addedEvents.data, withdrawnEvents.data])

  return { data, isLoading }
}
