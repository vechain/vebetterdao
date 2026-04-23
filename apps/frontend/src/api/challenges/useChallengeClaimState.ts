import { getConfig } from "@repo/config"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"

import { useEvents } from "@/hooks/useEvents"

const abi = B3TRChallenges__factory.abi
const contractAddress = getConfig().challengesContractAddress as `0x${string}`
export const challengePayoutClaimedEventName = "ChallengePayoutClaimed" as const
export const challengeRefundClaimedEventName = "ChallengeRefundClaimed" as const
export const splitWinPrizeClaimedEventName = "SplitWinPrizeClaimed" as const
export const splitWinCreatorRefundedEventName = "SplitWinCreatorRefunded" as const

export const useChallengeClaimState = (challengeId?: number, viewerAddress?: string) => {
  const isEnabled = !!viewerAddress && !!challengeId
  const filterParams =
    isEnabled && viewerAddress
      ? {
          challengeId: BigInt(challengeId),
          account: viewerAddress as `0x${string}`,
        }
      : undefined

  const payoutClaimedEvents = useEvents({
    abi,
    contractAddress,
    eventName: challengePayoutClaimedEventName,
    filterParams,
    select: events => events.length > 0,
    enabled: isEnabled,
  })

  const refundClaimedEvents = useEvents({
    abi,
    contractAddress,
    eventName: challengeRefundClaimedEventName,
    filterParams,
    select: events => events.length > 0,
    enabled: isEnabled,
  })

  return {
    data: {
      hasClaimed: payoutClaimedEvents.data ?? false,
      hasRefunded: refundClaimedEvents.data ?? false,
    },
    isLoading: payoutClaimedEvents.isLoading || refundClaimedEvents.isLoading,
    isError: payoutClaimedEvents.isError || refundClaimedEvents.isError,
    error: payoutClaimedEvents.error ?? refundClaimedEvents.error,
  }
}
