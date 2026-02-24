import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import BigNumber from "bignumber.js"
import { useMemo } from "react"

import type { TreasuryTransfer } from "./types"
import { useTreasuryB3trBalance } from "./useTreasuryBalances"

const config = getConfig()
const treasuryAddress = config.treasuryContractAddress.toLowerCase()
const baseUrl = config.indexerUrl?.replace("/api/v1", "") ?? ""

export type BalancePeriod = "1M" | "3M" | "1Y" | "All"

const PERIOD_SECONDS: Record<BalancePeriod, number> = {
  "1M": 30 * 24 * 60 * 60,
  "3M": 90 * 24 * 60 * 60,
  "1Y": 365 * 24 * 60 * 60,
  All: 0,
}

const fetchAllTreasuryTransfers = async (after: number): Promise<TreasuryTransfer[]> => {
  const all: TreasuryTransfer[] = []
  let page = 0
  let hasNext = true

  while (hasNext) {
    const params = new URLSearchParams()
    params.set("after", String(after))
    params.set("direction", "DESC")
    params.set("size", "150")
    params.set("page", String(page))

    const res = await fetch(`${baseUrl}/api/v1/b3tr/treasury/transfers?${params}`)
    if (!res.ok) break

    const json = await res.json()
    const transfers: TreasuryTransfer[] = json.data ?? []
    all.push(...transfers)

    hasNext = json.pagination?.hasNext === true
    page++

    if (page > 50) break
  }

  return all
}

export const useTreasuryBalanceHistory = (period: BalancePeriod) => {
  const { data: currentBalance, isLoading: balanceLoading } = useTreasuryB3trBalance()

  const after = useMemo(() => {
    const seconds = PERIOD_SECONDS[period]
    if (seconds === 0) return 0
    return Math.floor(Date.now() / 1000) - seconds
  }, [period])

  const {
    data: transfers,
    isLoading: transfersLoading,
    isFetching,
  } = useQuery({
    queryKey: ["treasury-balance-history", period, after],
    queryFn: () => fetchAllTreasuryTransfers(after),
    staleTime: 5 * 60 * 1000,
  })

  const isLoading = balanceLoading || transfersLoading

  const chartData = useMemo(() => {
    if (!currentBalance?.original || !transfers?.length) return []

    const sorted = [...transfers].sort((a, b) => b.blockTimestamp - a.blockTimestamp)

    let balance = new BigNumber(currentBalance.original)
    const points: { date: string; timestamp: number; b3tr: number }[] = []

    points.push({
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      timestamp: Math.floor(Date.now() / 1000),
      b3tr: balance.dividedBy(1e18).toNumber(),
    })

    for (const tx of sorted) {
      const value = new BigNumber(tx.value)
      const isOutgoing = tx.from.toLowerCase() === treasuryAddress
      const delta = isOutgoing ? value.negated() : value

      balance = balance.minus(delta)

      points.push({
        date: new Date(tx.blockTimestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        timestamp: tx.blockTimestamp,
        b3tr: balance.dividedBy(1e18).toNumber(),
      })
    }

    return points.reverse()
  }, [currentBalance?.original, transfers])

  return { chartData, isLoading, isFetching }
}
