import { useEvents } from "@/hooks"
import { useMemo } from "react"
import { X2EarnRewardsPool__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const contractInterface = X2EarnRewardsPool__factory.createInterface()
const contractAddress = getConfig().x2EarnRewardsPoolContractAddress

export type AppFundActivityEvent = {
  appId: string
  amount: string
  blockNumber: number
  txOrigin: string
  availableFunds?: string
  rewardsPoolBalance?: string
  txType: "DEPOSIT" | "WITHDRAW" | "DISTRIBUTE_REWARDS" | "REWARDS_POOL_UPDATED"
}

/**
 * Hook to get all the apps tx events such as:
 * Withdraw, Deposits, Reward Distribution, Rewards Pool Balance Updates
 * @param appId The app ID to get the transactions events from
 */
export const useAppFundActivityEvents = (appId: string) => {
  const filterParams = { appId }

  const rawDepositEvents = useEvents({
    contractAddress,
    contractInterface,
    eventName: "NewDeposit",
    filterParams,
    mapResponse: (decoded, meta) => ({
      appId: decoded.app,
      amount: decoded.amount,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
  })
  console.log({ rawDepositEvents })

  const rawTeamWithdrawalEvents = useEvents({
    contractAddress,
    contractInterface,
    eventName: "TeamWithdrawal",
    filterParams,
    mapResponse: (decoded, meta) => ({
      appId: decoded.app,
      amount: decoded.amount,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
  })

  const rawRewardDistributedEvents = useEvents({
    contractAddress,
    contractInterface,
    eventName: "RewardDistributed",
    filterParams,
    mapResponse: (decoded, meta) => ({
      appId: decoded.app,
      amount: decoded.amount,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
  })

  const rawRewardsPoolBalanceUpdatedEvents = useEvents({
    contractAddress,
    contractInterface,
    eventName: "RewardsPoolBalanceUpdated",
    filterParams,
    mapResponse: (decoded, meta) => ({
      appId: decoded.app,
      amount: decoded.amount,
      availableFunds: decoded.availableFunds,
      rewardsPoolBalance: decoded.rewardsPoolBalance,
      blockNumber: meta.blockNumber,
      txOrigin: meta.txOrigin,
    }),
  })

  const depositEvents = rawDepositEvents.data
  const teamWithdrawalEvents = rawTeamWithdrawalEvents.data
  const rewardDistributedEvents = rawRewardDistributedEvents.data
  const rewardsPoolBalanceUpdatedEvents = rawRewardsPoolBalanceUpdatedEvents.data

  const isLoading =
    rawDepositEvents.isLoading ||
    rawTeamWithdrawalEvents.isLoading ||
    rawRewardDistributedEvents.isLoading ||
    rawRewardsPoolBalanceUpdatedEvents.isLoading

  // Normalize and combine all events into a single array
  const allEvents = useMemo(() => {
    const normalized: AppFundActivityEvent[] = [
      ...(depositEvents?.map(event => ({
        ...event,
        txType: "DEPOSIT" as const,
      })) || []),
      ...(teamWithdrawalEvents?.map(event => ({
        ...event,
        txType: "WITHDRAW" as const,
      })) || []),
      ...(rewardDistributedEvents?.map(event => ({
        ...event,
        txType: "DISTRIBUTE_REWARDS" as const,
      })) || []),
      ...(rewardsPoolBalanceUpdatedEvents?.map(event => ({
        ...event,
        txType: "REWARDS_POOL_UPDATED" as const,
      })) || []),
    ]

    // Sort by block number (descending - newest first)
    return normalized.sort((a, b) => b.blockNumber - a.blockNumber)
  }, [depositEvents, teamWithdrawalEvents, rewardDistributedEvents])

  console.log({ allEvents })

  return {
    isLoading,
    data: allEvents,
    // In case needed
    rawData: {
      depositEvents,
      teamWithdrawalEvents,
      rewardDistributedEvents,
      rewardsPoolBalanceUpdatedEvents,
    },
  }
}
