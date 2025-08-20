import { useEvents } from "@/hooks"
import { useMemo, useCallback } from "react"
import { X2EarnRewardsPool__factory } from "@vechain-kit/vebetterdao-contracts"
import { getConfig } from "@repo/config"
import { ethers } from "ethers"

const abi = X2EarnRewardsPool__factory.abi
const contractAddress = getConfig().x2EarnRewardsPoolContractAddress

export type AppFundActivityEvent = {
  appId: string
  amount: string
  blockNumber: number
  txId: string
  availableFunds?: string
  rewardsPoolBalance?: string
  txType: string
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
    abi,
    eventName: "NewDeposit",
    filterParams,
    mapResponse: ({ decodedData, meta }) => ({
      appId: decodedData.args.appId,
      amount: ethers.formatEther(decodedData.args.amount),
      blockNumber: meta.blockNumber,
      txId: meta.txID,
      txType: "DEPOSIT",
    }),
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
    }),
  })

  const rawRewardDistributedEvents = useEvents({
    contractAddress,
    abi,
    eventName: "RewardDistributed",
    filterParams,
    mapResponse: ({ decodedData, meta }) => ({
      appId: decodedData.args.appId,
      amount: ethers.formatEther(decodedData.args.amount),
      blockNumber: meta.blockNumber,
      txId: meta.txID,
      txType: "DISTRIBUTE_REWARDS",
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
      })) || []),
      ...(teamWithdrawalEvents?.map(event => ({
        ...event,
      })) || []),
      ...(rewardDistributedEvents?.map(event => ({
        ...event,
      })) || []),
      ...(rewardsPoolBalanceUpdatedEvents?.map(event => ({
        ...event,
      })) || []),
    ]

    // Sort by block number (descending - newest first)
    return normalized.sort((a, b) => b.blockNumber - a.blockNumber)
  }, [depositEvents, teamWithdrawalEvents, rewardDistributedEvents, rewardsPoolBalanceUpdatedEvents])

  const refetch = useCallback(() => {
    rawDepositEvents.refetch()
    rawTeamWithdrawalEvents.refetch()
    rawRewardDistributedEvents.refetch()
    rawRewardsPoolBalanceUpdatedEvents.refetch()
  }, [rawDepositEvents, rawTeamWithdrawalEvents, rawRewardDistributedEvents, rawRewardsPoolBalanceUpdatedEvents])

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
    refetch,
  }
}
