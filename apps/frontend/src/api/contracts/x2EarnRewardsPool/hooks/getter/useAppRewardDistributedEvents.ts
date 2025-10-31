import { getConfig } from "@repo/config"
import { X2EarnRewardsPool__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnRewardsPool__factory"
import { ethers } from "ethers"
import { useMemo } from "react"

import { useEvents } from "../../../../../hooks/useEvents"

const abi = X2EarnRewardsPool__factory.abi
const contractAddress = getConfig().x2EarnRewardsPoolContractAddress

export type RewardDistributedEvent = {
  appId: string
  amount: string
  receiver: string
  proof: string
  distributor: string
  blockNumber: number
  txId: string
}

/**
 * Hook to get the latest RewardDistributed events for a specific app
 * @param appId The app ID to get the reward distribution events from
 * @param limit Optional limit on the number of events to return (default: 5)
 */
export const useAppRewardDistributedEvents = (appId: string, limit = 5) => {
  const filterParams = { appId }

  const { data, isLoading, ...rest } = useEvents({
    contractAddress,
    abi,
    eventName: "RewardDistributed",
    filterParams,
    mapResponse: ({ decodedData, meta }) => ({
      appId: decodedData.args.appId,
      amount: ethers.formatEther(decodedData.args.amount),
      receiver: decodedData.args.receiver,
      proof: decodedData.args.proof,
      distributor: decodedData.args.distributor,
      blockNumber: meta.blockNumber,
      txId: meta.txID,
    }),
  })

  // Sort by block number (descending - newest first) and limit the results
  const limitedData = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => b.blockNumber - a.blockNumber).slice(0, limit)
  }, [data, limit])

  return {
    data: limitedData,
    isLoading,
    ...rest,
  }
}
