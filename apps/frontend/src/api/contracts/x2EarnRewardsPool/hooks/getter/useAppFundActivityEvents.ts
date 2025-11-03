import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnRewardsPool__factory"
import { useThor } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useMemo, useCallback, useEffect, useState } from "react"

import { useEvents } from "../../../../../hooks/useEvents"

const abi = X2EarnRewardsPool__factory.abi
const contractAddress = getConfig().x2EarnRewardsPoolContractAddress
const contractInterface = X2EarnRewardsPool__factory.createInterface()
const xAllocationPoolAddress = getConfig().xAllocationPoolContractAddress.toLowerCase()
const dbaPoolAddress = getConfig().dbaPoolContractAddress.toLowerCase()

export type AppFundActivityEvent = {
  appId: string
  amount: string
  blockNumber: number
  txId: string
  availableFunds?: string
  rewardsPoolBalance?: string
  txType: string
  reason?: string
}
/**
 * Hook to get all the apps tx events such as:
 * Withdraw, Deposits, Reward Distribution, Rewards Pool Balance Updates
 * @param appId The app ID to get the transactions events from
 */
export const useAppFundActivityEvents = (appId: string) => {
  const thor = useThor()
  const [enrichedRewardsPoolEvents, setEnrichedRewardsPoolEvents] = useState<AppFundActivityEvent[]>([])
  const [isEnriching, setIsEnriching] = useState(false)

  const filterParams = { appId }
  const rawDepositEvents = useEvents({
    contractAddress,
    abi,
    eventName: "NewDeposit",
    filterParams,
    mapResponse: ({ decodedData, meta }) => {
      const depositor = (decodedData.args.depositor as string).toLowerCase()
      let txType = "DEPOSIT"

      if (depositor === xAllocationPoolAddress) {
        txType = "VOTES_ALLOCATION"
      } else if (depositor === dbaPoolAddress) {
        txType = "DYNAMIC_BASE_ALLOCATION"
      }

      return {
        appId: decodedData.args.appId,
        amount: ethers.formatEther(decodedData.args.amount),
        blockNumber: meta.blockNumber,
        txId: meta.txID,
        txType,
      }
    },
  })
  const rawTeamWithdrawalEvents = useEvents({
    contractAddress,
    abi,
    eventName: "TeamWithdrawal",
    filterParams,
    mapResponse: ({ decodedData, meta }) => ({
      appId: decodedData.args.appId,
      amount: ethers.formatEther(decodedData.args.amount),
      blockNumber: meta.blockNumber,
      txId: meta.txID,
      txType: "WITHDRAW",
      reason: decodedData.args.reason as string,
    }),
  })

  const rawRewardsPoolBalanceUpdatedEvents = useEvents({
    contractAddress,
    abi,
    eventName: "RewardsPoolBalanceUpdated",
    filterParams,
    mapResponse: ({ decodedData, meta }) => ({
      appId: decodedData.args.appId,
      amount: ethers.formatEther(decodedData.args.amount),
      availableFunds: ethers.formatEther(decodedData.args.availableFunds),
      rewardsPoolBalance: ethers.formatEther(decodedData.args.rewardsPoolBalance),
      blockNumber: meta.blockNumber,
      txId: meta.txID,
      txType: "REWARDS_POOL_UPDATED",
    }),
  })

  const depositEvents = rawDepositEvents.data
  const teamWithdrawalEvents = rawTeamWithdrawalEvents.data
  const rewardsPoolBalanceUpdatedEvents = rawRewardsPoolBalanceUpdatedEvents.data

  // Enrich rewards pool events with transaction data to determine increase/decrease
  useEffect(() => {
    const enrichEvents = async () => {
      if (!thor || !rewardsPoolBalanceUpdatedEvents || rewardsPoolBalanceUpdatedEvents.length === 0) {
        setEnrichedRewardsPoolEvents([])
        return
      }

      setIsEnriching(true)
      try {
        const enriched = await Promise.all(
          rewardsPoolBalanceUpdatedEvents.map(async event => {
            try {
              const tx = await thor.transactions.getTransaction(event.txId)
              if (tx && tx.clauses && tx.clauses.length > 0) {
                const clause = tx.clauses[0]
                if (clause && clause.data) {
                  try {
                    const decodedFunction = contractInterface.parseTransaction({ data: clause.data, value: 0n })
                    if (decodedFunction) {
                      const functionName = decodedFunction.name
                      if (functionName === "increaseRewardsPoolBalance") {
                        return { ...event, txType: "INCREASE_REWARDS_POOL" }
                      } else if (functionName === "decreaseRewardsPoolBalance") {
                        return { ...event, txType: "DECREASE_REWARDS_POOL" }
                      }
                    }
                  } catch (e) {
                    console.error(`Error decoding transaction data for tx ${event.txId}:`, e)
                  }
                }
              }
            } catch (e) {
              console.error(`Error fetching transaction ${event.txId}:`, e)
            }
            return event
          }),
        )
        setEnrichedRewardsPoolEvents(enriched)
      } finally {
        setIsEnriching(false)
      }
    }

    enrichEvents()
  }, [thor, rewardsPoolBalanceUpdatedEvents])

  const isLoading =
    rawDepositEvents.isLoading ||
    rawTeamWithdrawalEvents.isLoading ||
    rawRewardsPoolBalanceUpdatedEvents.isLoading ||
    isEnriching

  // Normalize and combine all events into a single array
  const allEvents = useMemo(() => {
    const normalized: AppFundActivityEvent[] = [
      ...(depositEvents?.map(event => ({
        ...event,
      })) || []),
      ...(teamWithdrawalEvents?.map(event => ({
        ...event,
      })) || []),
      ...(enrichedRewardsPoolEvents?.map(event => ({
        ...event,
      })) || []),
    ]

    // Sort by block number (descending - newest first)
    return normalized.sort((a, b) => b.blockNumber - a.blockNumber)
  }, [depositEvents, teamWithdrawalEvents, enrichedRewardsPoolEvents])

  const refetch = useCallback(() => {
    rawDepositEvents.refetch()
    rawTeamWithdrawalEvents.refetch()
    rawRewardsPoolBalanceUpdatedEvents.refetch()
  }, [rawDepositEvents, rawTeamWithdrawalEvents, rawRewardsPoolBalanceUpdatedEvents])

  return {
    isLoading,
    data: allEvents,
    // In case needed
    rawData: {
      depositEvents,
      teamWithdrawalEvents,
      rewardsPoolBalanceUpdatedEvents: enrichedRewardsPoolEvents,
    },
    refetch,
  }
}
