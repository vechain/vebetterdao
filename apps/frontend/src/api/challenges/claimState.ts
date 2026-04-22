import { QueryClient } from "@tanstack/react-query"
import { ThorClient } from "@vechain/sdk-network"

import { fetchChallengeEvents } from "./fetchChallengeEvents"

export interface ViewerClaimState {
  payoutClaimed: Set<number>
  refundClaimed: Set<number>
  splitWinClaimed: Set<number>
  creatorRefunded: Set<number>
}

interface FetchViewerClaimStateParams {
  thor: ThorClient
  queryClient: QueryClient
  contractAddress: string
  fromBlock: number
  viewer: string
}

/**
 * Scans claim-related events filtered by the viewer's indexed topic and
 * returns the set of challenge ids where the viewer has already claimed.
 */
export const fetchViewerClaimState = async ({
  thor,
  queryClient,
  contractAddress,
  fromBlock,
  viewer,
}: FetchViewerClaimStateParams): Promise<ViewerClaimState> => {
  const [payouts, refunds, splitWinPrizes, creatorRefunds] = await Promise.all([
    fetchChallengeEvents({
      thor,
      queryClient,
      contractAddress,
      fromBlock,
      eventName: "ChallengePayoutClaimed",
      filterParams: { account: viewer } as never,
    }),
    fetchChallengeEvents({
      thor,
      queryClient,
      contractAddress,
      fromBlock,
      eventName: "ChallengeRefundClaimed",
      filterParams: { account: viewer } as never,
    }),
    fetchChallengeEvents({
      thor,
      queryClient,
      contractAddress,
      fromBlock,
      eventName: "SplitWinPrizeClaimed",
      filterParams: { winner: viewer } as never,
    }),
    fetchChallengeEvents({
      thor,
      queryClient,
      contractAddress,
      fromBlock,
      eventName: "SplitWinCreatorRefunded",
      filterParams: { creator: viewer } as never,
    }),
  ])

  const toIds = (events: { decodedData: { args: unknown } }[]) =>
    new Set<number>(
      events.map(e => {
        const args = e.decodedData.args as { challengeId?: bigint } | readonly [bigint, ...unknown[]]
        const id = Array.isArray(args) ? (args[0] as bigint) : (args as { challengeId: bigint }).challengeId
        return Number(id)
      }),
    )

  return {
    payoutClaimed: toIds(payouts),
    refundClaimed: toIds(refunds),
    splitWinClaimed: toIds(splitWinPrizes),
    creatorRefunded: toIds(creatorRefunds),
  }
}

interface FetchChallengeClaimedByParams {
  thor: ThorClient
  queryClient: QueryClient
  contractAddress: string
  fromBlock: number
  challengeId: number
}

/**
 * Scans claim events scoped to a specific challenge id to build the
 * `claimedBy` / `refundedBy` / `creatorRefunded` arrays used by the detail view.
 */
export const fetchChallengeClaimedBy = async ({
  thor,
  queryClient,
  contractAddress,
  fromBlock,
  challengeId,
}: FetchChallengeClaimedByParams) => {
  const id = BigInt(challengeId)
  const [payouts, refunds, splitWinPrizes, creatorRefunds] = await Promise.all([
    fetchChallengeEvents({
      thor,
      queryClient,
      contractAddress,
      fromBlock,
      eventName: "ChallengePayoutClaimed",
      filterParams: { challengeId: id } as never,
    }),
    fetchChallengeEvents({
      thor,
      queryClient,
      contractAddress,
      fromBlock,
      eventName: "ChallengeRefundClaimed",
      filterParams: { challengeId: id } as never,
    }),
    fetchChallengeEvents({
      thor,
      queryClient,
      contractAddress,
      fromBlock,
      eventName: "SplitWinPrizeClaimed",
      filterParams: { challengeId: id } as never,
    }),
    fetchChallengeEvents({
      thor,
      queryClient,
      contractAddress,
      fromBlock,
      eventName: "SplitWinCreatorRefunded",
      filterParams: { challengeId: id } as never,
    }),
  ])

  const extractAddresses = <T extends { decodedData: { args: unknown } }>(events: T[], field: string) =>
    events.map(e => (e.decodedData.args as Record<string, string>)[field] as string)

  const claimedBy = Array.from(
    new Set(
      [...extractAddresses(payouts, "account"), ...extractAddresses(splitWinPrizes, "winner")].map(a =>
        a.toLowerCase(),
      ),
    ),
  )
  const refundedBy = Array.from(new Set(extractAddresses(refunds, "account").map(a => a.toLowerCase())))
  const creatorRefunded = creatorRefunds.length > 0

  return { claimedBy, refundedBy, creatorRefunded }
}
