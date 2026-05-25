import { useUserOnboardingPhase } from "@/hooks/useUserOnboardingPhase"

import { ActiveVoterCard } from "./ActiveVoterCard"
import { FirstVoteCard } from "./FirstVoteCard"
import { OnboardingPhaseCard } from "./OnboardingPhaseCard"

/**
 * Single entry point for the voter-journey cards. Picks one of three variants based on
 * the user's onboarding phase:
 *
 * - "onboarding"   → OnboardingPhaseCard  (never voted, not eligible yet — prep for first vote)
 * - "first-vote"   → FirstVoteCard         (never voted, eligible this round — first voting roadmap)
 * - "active-voter" → ActiveVoterCard       (has voted before — regular round-by-round cycle)
 * - null           → renders nothing (loading or no wallet)
 *
 * Non-journey "can't vote" reasons (delegator, secondary, signaled, blacklisted) are owned
 * by `CantVoteCard` and rendered separately at the same call sites.
 */
export const OnboardingCard = () => {
  const { phase } = useUserOnboardingPhase()

  if (phase === "onboarding") return <OnboardingPhaseCard />
  if (phase === "first-vote") return <FirstVoteCard />
  if (phase === "active-voter") return <ActiveVoterCard />
  return null
}
