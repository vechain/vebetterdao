import { getConfig } from "@repo/config"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { formatEther } from "ethers"
import { useMemo } from "react"
import { ContractEventName } from "viem"

import { useEvents } from "@/hooks/useEvents"

import { ChallengeDetail, ChallengeKind, ChallengeStatus, SettlementMode } from "./types"

const abi = B3TRChallenges__factory.abi
type ChallengesAbi = typeof abi
const contractAddress = getConfig().challengesContractAddress as `0x${string}`

export type ActivityEntryType =
  | "created"
  | "invited"
  | "joined"
  | "accepted"
  | "declined"
  | "left"
  | "cancelled"
  | "activated"
  | "invalidated"
  | "completed"
  | "payoutClaimed"
  | "splitWinPrizeClaimed"
  | "splitWinCreatorRefunded"
  | "refundClaimed"

export interface ChallengeActivityEntry {
  id: string
  type: ActivityEntryType
  blockNumber: number
  timestamp: number
  address?: string
  amount?: string
  settlementMode?: SettlementMode
  bestCount?: number
}

const useEventForChallenge = <K extends ContractEventName<ChallengesAbi>>(
  eventName: K,
  challengeId: bigint,
  enabled: boolean,
) =>
  useEvents({
    abi,
    contractAddress,
    eventName,
    filterParams: { challengeId } as never,
    enabled,
    order: "asc",
  })

export const useChallengeActivityLog = (challenge: ChallengeDetail) => {
  const enabled = !!challenge.challengeId
  const challengeId = BigInt(challenge.challengeId)
  const isStake = challenge.kind === ChallengeKind.Stake

  const created = useEventForChallenge("ChallengeCreated", challengeId, enabled)
  const invited = useEventForChallenge("ChallengeInviteAdded", challengeId, enabled)
  const joined = useEventForChallenge("ChallengeJoined", challengeId, enabled)
  const declined = useEventForChallenge("ChallengeDeclined", challengeId, enabled)
  const left = useEventForChallenge("ChallengeLeft", challengeId, enabled)
  const cancelled = useEventForChallenge("ChallengeCancelled", challengeId, enabled)
  const activated = useEventForChallenge("ChallengeActivated", challengeId, enabled)
  const invalidated = useEventForChallenge("ChallengeInvalidated", challengeId, enabled)
  const completed = useEventForChallenge("ChallengeCompleted", challengeId, enabled)
  const payoutClaimed = useEventForChallenge("ChallengePayoutClaimed", challengeId, enabled)
  const splitWinPrizeClaimed = useEventForChallenge("SplitWinPrizeClaimed", challengeId, enabled)
  const splitWinCreatorRefunded = useEventForChallenge("SplitWinCreatorRefunded", challengeId, enabled)
  const refundClaimed = useEventForChallenge("ChallengeRefundClaimed", challengeId, enabled)

  const allQueries = [
    created,
    invited,
    joined,
    declined,
    left,
    cancelled,
    activated,
    invalidated,
    completed,
    payoutClaimed,
    splitWinPrizeClaimed,
    splitWinCreatorRefunded,
    refundClaimed,
  ]

  const isLoading = allQueries.some(q => q.isLoading)
  const isError = allQueries.some(q => q.isError)

  const stakeDisplay = isStake ? challenge.stakeAmount : undefined

  const entries = useMemo(() => {
    if (isLoading) return []

    const invitedAddresses = new Set(
      (invited.data ?? []).map(e => (e.decodedData.args as { invitee: string }).invitee.toLowerCase()),
    )

    const items: ChallengeActivityEntry[] = []

    for (const e of created.data ?? []) {
      items.push({
        id: `${e.meta.txID}-created`,
        type: "created",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        address: (e.decodedData.args as { creator: string }).creator,
      })
    }

    for (const e of invited.data ?? []) {
      items.push({
        id: `${e.meta.txID}-invited-${(e.decodedData.args as { invitee: string }).invitee}`,
        type: "invited",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        address: (e.decodedData.args as { invitee: string }).invitee,
      })
    }

    for (const e of joined.data ?? []) {
      const participant = (e.decodedData.args as { participant: string }).participant
      const wasInvited = invitedAddresses.has(participant.toLowerCase())
      items.push({
        id: `${e.meta.txID}-joined-${participant}`,
        type: wasInvited ? "accepted" : "joined",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        address: participant,
        amount: stakeDisplay,
      })
    }

    for (const e of declined.data ?? []) {
      items.push({
        id: `${e.meta.txID}-declined-${(e.decodedData.args as { participant: string }).participant}`,
        type: "declined",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        address: (e.decodedData.args as { participant: string }).participant,
      })
    }

    for (const e of left.data ?? []) {
      items.push({
        id: `${e.meta.txID}-left-${(e.decodedData.args as { participant: string }).participant}`,
        type: "left",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        address: (e.decodedData.args as { participant: string }).participant,
      })
    }

    for (const e of cancelled.data ?? []) {
      items.push({
        id: `${e.meta.txID}-cancelled`,
        type: "cancelled",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })
    }

    for (const e of activated.data ?? []) {
      items.push({
        id: `${e.meta.txID}-activated`,
        type: "activated",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })
    }

    for (const e of invalidated.data ?? []) {
      items.push({
        id: `${e.meta.txID}-invalidated`,
        type: "invalidated",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
      })
    }

    // When the challenge is Invalid but no on-chain event was emitted (syncChallenge not called),
    // inject a synthetic entry so the timeline always shows invalidation.
    if (challenge.status === ChallengeStatus.Invalid && (invalidated.data ?? []).length === 0) {
      const lastBlock = items.reduce((max, e) => Math.max(max, e.blockNumber), 0)
      const lastTimestamp = items.reduce((max, e) => (e.blockNumber === lastBlock ? e.timestamp : max), 0)
      items.push({
        id: `synthetic-invalidated-${challenge.challengeId}`,
        type: "invalidated",
        blockNumber: lastBlock + 1,
        timestamp: lastTimestamp,
      })
    }

    for (const e of completed.data ?? []) {
      const args = e.decodedData.args as {
        settlementMode: number
        bestCount: bigint
      }
      items.push({
        id: `${e.meta.txID}-completed`,
        type: "completed",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        settlementMode: args.settlementMode as SettlementMode,
        bestCount: Number(args.bestCount),
      })
    }

    for (const e of payoutClaimed.data ?? []) {
      const args = e.decodedData.args as { account: string; amount: bigint }
      items.push({
        id: `${e.meta.txID}-payout-${args.account}`,
        type: "payoutClaimed",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        address: args.account,
        amount: formatEther(args.amount),
      })
    }

    for (const e of splitWinPrizeClaimed.data ?? []) {
      const args = e.decodedData.args as { winner: string; prize: bigint }
      items.push({
        id: `${e.meta.txID}-splitwin-prize-${args.winner}`,
        type: "splitWinPrizeClaimed",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        address: args.winner,
        amount: formatEther(args.prize),
      })
    }

    for (const e of splitWinCreatorRefunded.data ?? []) {
      const args = e.decodedData.args as { creator: string; amount: bigint }
      items.push({
        id: `${e.meta.txID}-splitwin-refund-${args.creator}`,
        type: "splitWinCreatorRefunded",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        address: args.creator,
        amount: formatEther(args.amount),
      })
    }

    for (const e of refundClaimed.data ?? []) {
      const args = e.decodedData.args as { account: string; amount: bigint }
      items.push({
        id: `${e.meta.txID}-refund-${args.account}`,
        type: "refundClaimed",
        blockNumber: e.meta.blockNumber,
        timestamp: e.meta.blockTimestamp,
        address: args.account,
        amount: formatEther(args.amount),
      })
    }

    items.sort((a, b) => a.blockNumber - b.blockNumber)
    items.reverse()
    return items
  }, [
    isLoading,
    created.data,
    invited.data,
    joined.data,
    declined.data,
    left.data,
    cancelled.data,
    activated.data,
    invalidated.data,
    completed.data,
    payoutClaimed.data,
    splitWinPrizeClaimed.data,
    splitWinCreatorRefunded.data,
    refundClaimed.data,
    stakeDisplay,
    challenge.status,
    challenge.challengeId,
  ])

  return { entries, isLoading, isError }
}
