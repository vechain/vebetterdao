import { useWallet } from "@vechain/vechain-kit"

import { useGetUserGMs } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useVeDelegateAutoDeposit } from "@/api/contracts/veDelegate/hooks/useVeDelegateAutoDeposit"
import { useAccountLinking } from "@/api/contracts/vePassport/hooks/useAccountLinking"
import { useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { useUserDelegation } from "@/api/contracts/vePassport/hooks/useUserDelegation"

import { useIsVeDelegated } from "./useIsVeDelegated"

/**
 * Where the user sits in the VeBetterDAO voter journey.
 *
 * - "onboarding"    → never voted (no Galaxy Member NFT) AND not eligible this round.
 *                     Has to complete the 3-step onboarding (actions → power up → hold VOT3)
 *                     before they can vote.
 * - "first-vote"    → never voted (no GM) AND eligible this round.
 *                     The card persists for the entire round; if they skip this round, it
 *                     carries over to the next round (still no GM, still eligible).
 * - "active-voter"  → has voted before (has GM). Regular cycle: claim rewards, vote again,
 *                     keep using apps, power up more.
 * - null            → cannot classify yet OR the user is in an edge-case "can't vote" state
 *                     (delegator, secondary/linked account, signaled, blacklisted, veDelegate
 *                     user). Those surfaces are owned by `CantVoteCard` / `DelegatingBanner`,
 *                     not the onboarding journey, so the hook bails out so the journey card
 *                     doesn't compete for the same slot.
 *
 * Detection rationale:
 * Galaxy Member NFT is auto-minted on the user's first vote (see GmNFTAndNodeCard empty
 * state). It is therefore an on-chain, contract-enforced "ever voted" marker that does not
 * decay with time and survives wallet sessions. Combined with the existing per-round
 * eligibility signals from useCanUserVote, it gives a stable three-way classification.
 *
 * Trade-off: a user who transfers their GM away would re-enter the "onboarding"/"first-vote"
 * phases on the next eligibility check. Acceptable for an edge case.
 */
export type UserOnboardingPhase = "onboarding" | "first-vote" | "active-voter" | null

export const useUserOnboardingPhase = (): {
  phase: UserOnboardingPhase
  isLoading: boolean
  hasGM: boolean
  isEligibleThisRound: boolean
} => {
  const { account } = useWallet()
  const { data: userGMs, isLoading: isGMsLoading } = useGetUserGMs()
  const { hasVotesAtSnapshot, isPerson, personReason, isLoading: isCanVoteLoading } = useCanUserVote()
  const { isEntity, isLoading: isLoadingAccountLinking } = useAccountLinking()
  const { isDelegator, isLoading: isLoadingDelegator } = useUserDelegation()
  const { isLoading: isDelegateeLoading } = useGetDelegatee(account?.address)
  const { isVeDelegated } = useIsVeDelegated(account?.address ?? "")
  const { hasAutoDeposit } = useVeDelegateAutoDeposit(account?.address)

  const isLoading =
    isGMsLoading || isCanVoteLoading || isLoadingAccountLinking || isLoadingDelegator || isDelegateeLoading
  const hasGM = (userGMs?.length ?? 0) > 0
  const isEligibleThisRound = !!hasVotesAtSnapshot && !!isPerson

  if (!account?.address || isLoading) {
    return { phase: null, isLoading, hasGM, isEligibleThisRound }
  }

  // Edge cases owned by other surfaces — defer so the journey card doesn't compete for the slot.
  // veDelegate users see DelegatingBanner; delegator/secondary/signaled/blacklisted see CantVoteCard.
  const isUsingVeDelegate = isVeDelegated || hasAutoDeposit
  const isSignaledOrBlacklisted =
    !isPerson && (personReason.includes("signaled") || personReason.includes("blacklisted"))
  if (isUsingVeDelegate || isEntity || isDelegator || isSignaledOrBlacklisted) {
    return { phase: null, isLoading, hasGM, isEligibleThisRound }
  }

  // Eligibility for THIS round drives the phase. GM only refines which "eligible" sub-state
  // applies. A previously-active voter who lost their actions (isPerson=false) this round is
  // back in the onboarding phase — they need to do something to vote this round, exactly the
  // same as a brand-new user. The OnboardingPhaseCard's sub-variant (new vs returning) keys
  // off hasVotesAtSnapshot, not GM, so this routes correctly.
  if (!isEligibleThisRound) {
    return { phase: "onboarding", isLoading, hasGM, isEligibleThisRound }
  }
  return {
    phase: hasGM ? "active-voter" : "first-vote",
    isLoading,
    hasGM,
    isEligibleThisRound,
  }
}
