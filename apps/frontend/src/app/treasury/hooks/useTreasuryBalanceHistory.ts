import { getConfig } from "@repo/config"
import BigNumber from "bignumber.js"
import { useMemo } from "react"

import { Transaction, useTransactions } from "@/api/indexer/transactions/useTransactions"

import { useTreasuryB3trBalance } from "./useTreasuryBalances"

const config = getConfig()
const treasuryAddress = config.treasuryContractAddress.toLowerCase()
const b3trAddress = config.b3trContractAddress.toLowerCase()

const isB3trTransfer = (tx: Transaction): boolean => {
  if (tx.tokenAddress?.toLowerCase() === b3trAddress || tx.contractAddress?.toLowerCase() === b3trAddress) return true
  if (tx.eventName === "B3TR_SWAP_VOT3_TO_B3TR" || tx.eventName === "B3TR_SWAP_B3TR_TO_VOT3") return true
  if (tx.eventName === "B3TR_UPGRADE_GM" || tx.eventName === "B3TR_CLAIM_REWARD") return true
  return false
}

const getB3trDelta = (tx: Transaction): BigNumber => {
  if (!isB3trTransfer(tx) || !tx.value) return new BigNumber(0)
  const value = new BigNumber(tx.value)
  const isOutgoing = tx.from?.toLowerCase() === treasuryAddress
  return isOutgoing ? value.negated() : value
}

export const useTreasuryBalanceHistory = () => {
  const { data: currentBalance, isLoading: balanceLoading } = useTreasuryB3trBalance()

  const { data: transferPages, isLoading: transfersLoading } = useTransactions(config.treasuryContractAddress, {
    eventName: [
      "TRANSFER_FT",
      "B3TR_SWAP_VOT3_TO_B3TR",
      "B3TR_SWAP_B3TR_TO_VOT3",
      "B3TR_UPGRADE_GM",
      "B3TR_CLAIM_REWARD",
    ],
    size: 100,
  })

  const isLoading = balanceLoading || transfersLoading

  const chartData = useMemo(() => {
    if (!currentBalance?.original || !transferPages?.pages?.length) return []

    const transactions = transferPages.pages
      .flatMap(page => page.data)
      .filter(isB3trTransfer)
      .sort((a, b) => b.blockTimestamp - a.blockTimestamp)

    if (transactions.length === 0) return []

    let balance = new BigNumber(currentBalance.original)
    const points: { date: string; timestamp: number; b3tr: number }[] = []

    points.push({
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      timestamp: Math.floor(Date.now() / 1000),
      b3tr: balance.dividedBy(1e18).toNumber(),
    })

    for (const tx of transactions) {
      const delta = getB3trDelta(tx)
      balance = balance.minus(delta)

      points.push({
        date: new Date(tx.blockTimestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        timestamp: tx.blockTimestamp,
        b3tr: balance.dividedBy(1e18).toNumber(),
      })
    }

    return points.reverse()
  }, [currentBalance?.original, transferPages?.pages])

  return { chartData, isLoading }
}
