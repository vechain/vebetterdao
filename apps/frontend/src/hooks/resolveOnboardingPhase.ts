export type UserOnboardingPhase = "onboarding" | "first-vote" | "active-voter" | null

export type OnboardingPhaseResult = {
  phase: UserOnboardingPhase
  isLoading: boolean
  hasGM: boolean
  isEligibleThisRound: boolean
  hasPastRoundVote: boolean
  hasPastRoundClaim: boolean
}

export type OnboardingPhaseInputs = {
  hasAccount: boolean
  isGMsLoading: boolean
  isCanVoteLoading: boolean
  isLoadingAccountLinking: boolean
  isLoadingDelegator: boolean
  isDelegateeLoading: boolean
  isVoteTxLoading: boolean
  isClaimTxLoading: boolean
  isRoundIdLoading: boolean
  isRoundInfoLoading: boolean
  currentRoundVoteStartBlock: number | undefined
  hasVotesAtSnapshot: boolean
  isPerson: boolean
  personReason: string
  isEntity: boolean
  isDelegator: boolean
  isVeDelegated: boolean
  hasAutoDeposit: boolean
  hasGM: boolean
  hasPastRoundVote: boolean
  hasPastRoundClaim: boolean
}

/**
 * Pure resolver. Extracted so the loading/phase composition can be unit-tested without
 * mocking React hooks or pulling in wallet/SDK modules. The bug this guards against: if
 * round data is missing from the composite isLoading, a veteran user transiently
 * classifies as "first-vote" between vote/claim tx data resolving and round data
 * resolving.
 */
export const resolveOnboardingPhase = (inputs: OnboardingPhaseInputs): OnboardingPhaseResult => {
  const isLoading =
    inputs.isGMsLoading ||
    inputs.isCanVoteLoading ||
    inputs.isLoadingAccountLinking ||
    inputs.isLoadingDelegator ||
    inputs.isDelegateeLoading ||
    inputs.isVoteTxLoading ||
    inputs.isClaimTxLoading ||
    inputs.isRoundIdLoading ||
    inputs.isRoundInfoLoading ||
    !inputs.currentRoundVoteStartBlock
  const isEligibleThisRound = !!inputs.hasVotesAtSnapshot && !!inputs.isPerson
  const base = {
    isLoading,
    hasGM: inputs.hasGM,
    isEligibleThisRound,
    hasPastRoundVote: inputs.hasPastRoundVote,
    hasPastRoundClaim: inputs.hasPastRoundClaim,
  }

  if (!inputs.hasAccount || isLoading) return { phase: null, ...base }

  // Edge cases owned by other surfaces — veDelegate users see DelegatingBanner;
  // delegator/secondary/signaled/blacklisted see CantVoteCard.
  const isUsingVeDelegate = inputs.isVeDelegated || inputs.hasAutoDeposit
  const isSignaledOrBlacklisted =
    !inputs.isPerson && (inputs.personReason.includes("signaled") || inputs.personReason.includes("blacklisted"))
  if (isUsingVeDelegate || inputs.isEntity || inputs.isDelegator || isSignaledOrBlacklisted) {
    return { phase: null, ...base }
  }

  // Not eligible this round → onboarding wins over the graduated gate and the
  // active-voter promotion.
  if (!isEligibleThisRound) return { phase: "onboarding", ...base }
  // Eligible + graduated (already claimed in a past round) → veteran, no journey card.
  if (inputs.hasPastRoundClaim) return { phase: null, ...base }
  // Eligible + past-round vote → Phase 3 bridge cycle.
  if (inputs.hasPastRoundVote) return { phase: "active-voter", ...base }
  // Eligible this round with no past-round vote: first-vote phase.
  return { phase: "first-vote", ...base }
}
