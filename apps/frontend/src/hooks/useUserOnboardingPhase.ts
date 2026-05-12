import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useGetUserGMs } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useVeDelegateAutoDeposit } from "@/api/contracts/veDelegate/hooks/useVeDelegateAutoDeposit"
import { useAccountLinking } from "@/api/contracts/vePassport/hooks/useAccountLinking"
import { useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { useUserDelegation } from "@/api/contracts/vePassport/hooks/useUserDelegation"
import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useTransactions } from "@/api/indexer/transactions/useTransactions"

import { useIsVeDelegated } from "./useIsVeDelegated"

/**
 * Where the user sits in the VeBetterDAO voter journey.
 *
 * - "onboarding"    → not eligible this round AND no past-round vote activity.
 *                     Has to complete the 3-step onboarding (actions → power up → hold VOT3)
 *                     before they can vote.
 * - "first-vote"    → eligible this round AND no past-round vote activity. Covers both the
 *                     "no GM yet" case AND the "just minted my first GM this round" case —
 *                     the user hasn't yet been through a full round-to-round cycle.
 * - "active-voter"  → voted in a past round AND has never claimed in a past round. A
 *                     one-cycle bridge: it's the round right after the user's first vote,
 *                     where they're about to claim and rebuild voting power for the next
 *                     round. Once they actually claim, the round after that flips them out
 *                     of the journey entirely (phase === null) — they're a veteran from
 *                     then on and need no special onboarding card.
 * - null            → graduated (has past-round vote AND past-round claim), OR loading, OR
 *                     an edge-case "can't vote" state (veDelegate, delegator, secondary,
 *                     signaled, blacklisted). Those edge cases are owned by `CantVoteCard`
 *                     / `DelegatingBanner`.
 *
 * Detection rationale:
 * Past-round B3TR_XALLOCATION_VOTE events mark "the user has been through at least one
 * round already" — flips on the round after the user's first vote, which is the right
 * boundary into Phase 3. Past-round B3TR_CLAIM_REWARD events then mark "the user has
 * already lived through a claim cycle" — once present, Phase 3 retires for good. The
 * current-round vote/claim is excluded from both checks via block-number comparison, so the
 * card sticks around for the rest of the current round whether they just voted or just
 * claimed.
 */
export type UserOnboardingPhase = "onboarding" | "first-vote" | "active-voter" | null

export const useUserOnboardingPhase = (): {
  phase: UserOnboardingPhase
  isLoading: boolean
  hasGM: boolean
  isEligibleThisRound: boolean
  hasPastRoundVote: boolean
  hasPastRoundClaim: boolean
} => {
  const { account } = useWallet()
  const { data: userGMs, isLoading: isGMsLoading } = useGetUserGMs()
  const { hasVotesAtSnapshot, isPerson, personReason, isLoading: isCanVoteLoading } = useCanUserVote()
  const { isEntity, isLoading: isLoadingAccountLinking } = useAccountLinking()
  const { isDelegator, isLoading: isLoadingDelegator } = useUserDelegation()
  const { isLoading: isDelegateeLoading } = useGetDelegatee(account?.address)
  const { isVeDelegated } = useIsVeDelegated(account?.address ?? "")
  const { hasAutoDeposit } = useVeDelegateAutoDeposit(account?.address)

  const { data: currentRoundIdRaw } = useCurrentAllocationsRoundId()
  const currentRoundId = currentRoundIdRaw ?? "0"
  const currentRoundInfo = useAllocationsRound(currentRoundId)
  const currentRoundVoteStartBlock = currentRoundInfo.data?.voteStart
    ? Number(currentRoundInfo.data.voteStart)
    : undefined

  // Past-round vote activity — promotes the user from Phase 2 to Phase 3 the round after
  // their first vote. Past-round claim activity — graduates them out of Phase 3 the round
  // after their first claim. Both filters exclude current-round events via block-number
  // comparison, so the card stays put for the rest of the current round.
  const { data: voteTxData, isLoading: isVoteTxLoading } = useTransactions(account?.address ?? "", {
    size: 10,
    eventName: ["B3TR_XALLOCATION_VOTE"],
  })
  const { data: claimTxData, isLoading: isClaimTxLoading } = useTransactions(account?.address ?? "", {
    size: 10,
    eventName: ["B3TR_CLAIM_REWARD"],
  })
  const hasPastRoundVote = useMemo(() => {
    if (!currentRoundVoteStartBlock) return false
    const votes = voteTxData?.pages.flatMap(p => p.data) ?? []
    return votes.some(tx => Number(tx.blockNumber) < currentRoundVoteStartBlock)
  }, [voteTxData, currentRoundVoteStartBlock])
  const hasPastRoundClaim = useMemo(() => {
    if (!currentRoundVoteStartBlock) return false
    const claims = claimTxData?.pages.flatMap(p => p.data) ?? []
    return claims.some(tx => Number(tx.blockNumber) < currentRoundVoteStartBlock)
  }, [claimTxData, currentRoundVoteStartBlock])

  const isLoading =
    isGMsLoading ||
    isCanVoteLoading ||
    isLoadingAccountLinking ||
    isLoadingDelegator ||
    isDelegateeLoading ||
    isVoteTxLoading ||
    isClaimTxLoading
  const hasGM = (userGMs?.length ?? 0) > 0
  const isEligibleThisRound = !!hasVotesAtSnapshot && !!isPerson

  if (!account?.address || isLoading) {
    return { phase: null, isLoading, hasGM, isEligibleThisRound, hasPastRoundVote, hasPastRoundClaim }
  }

  // Edge cases owned by other surfaces — defer so the journey card doesn't compete for the slot.
  // veDelegate users see DelegatingBanner; delegator/secondary/signaled/blacklisted see CantVoteCard.
  const isUsingVeDelegate = isVeDelegated || hasAutoDeposit
  const isSignaledOrBlacklisted =
    !isPerson && (personReason.includes("signaled") || personReason.includes("blacklisted"))
  if (isUsingVeDelegate || isEntity || isDelegator || isSignaledOrBlacklisted) {
    return { phase: null, isLoading, hasGM, isEligibleThisRound, hasPastRoundVote, hasPastRoundClaim }
  }

  // Not eligible this round → onboarding card explains what to fix. This wins over BOTH
  // the graduated gate and the active-voter promotion: a veteran who lost actions this
  // round still needs the "you can still vote this round" framing, and a returning voter
  // shouldn't see a Phase-3-style roadmap that assumes they can vote.
  if (!isEligibleThisRound) {
    return { phase: "onboarding", isLoading, hasGM, isEligibleThisRound, hasPastRoundVote, hasPastRoundClaim }
  }

  // Eligible + graduated (already claimed in a past round) → veteran, no journey card.
  if (hasPastRoundClaim) {
    return { phase: null, isLoading, hasGM, isEligibleThisRound, hasPastRoundVote, hasPastRoundClaim }
  }

  // Eligible + past-round vote → Phase 3 bridge cycle.
  if (hasPastRoundVote) {
    return {
      phase: "active-voter",
      isLoading,
      hasGM,
      isEligibleThisRound,
      hasPastRoundVote,
      hasPastRoundClaim,
    }
  }

  // Eligible this round with no past-round vote: first-vote phase. Covers brand-new voters
  // and users who minted their first GM this round.
  return { phase: "first-vote", isLoading, hasGM, isEligibleThisRound, hasPastRoundVote, hasPastRoundClaim }
}
