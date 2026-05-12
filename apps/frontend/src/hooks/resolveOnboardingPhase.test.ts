import { describe, expect, it } from "vitest"

import { type OnboardingPhaseInputs, resolveOnboardingPhase } from "./resolveOnboardingPhase"

const VOTE_START_BLOCK = 1_000_000

const baseInputs = (overrides: Partial<OnboardingPhaseInputs> = {}): OnboardingPhaseInputs => ({
  hasAccount: true,
  isGMsLoading: false,
  isCanVoteLoading: false,
  isLoadingAccountLinking: false,
  isLoadingDelegator: false,
  isDelegateeLoading: false,
  isVoteTxLoading: false,
  isClaimTxLoading: false,
  isRoundIdLoading: false,
  isRoundInfoLoading: false,
  currentRoundVoteStartBlock: VOTE_START_BLOCK,
  hasVotesAtSnapshot: true,
  isPerson: true,
  personReason: "",
  isEntity: false,
  isDelegator: false,
  isVeDelegated: false,
  hasAutoDeposit: false,
  hasGM: true,
  hasPastRoundVote: false,
  hasPastRoundClaim: false,
  ...overrides,
})

describe("resolveOnboardingPhase", () => {
  describe("race condition: vote/claim resolved before round data", () => {
    it("returns phase=null and isLoading=true when round id is still loading", () => {
      const result = resolveOnboardingPhase(
        baseInputs({
          isRoundIdLoading: true,
          currentRoundVoteStartBlock: undefined,
          hasPastRoundVote: false,
          hasPastRoundClaim: false,
        }),
      )
      expect(result.isLoading).toBe(true)
      expect(result.phase).toBeNull()
    })

    it("returns phase=null and isLoading=true when round info is still loading", () => {
      const result = resolveOnboardingPhase(
        baseInputs({
          isRoundInfoLoading: true,
          currentRoundVoteStartBlock: undefined,
        }),
      )
      expect(result.isLoading).toBe(true)
      expect(result.phase).toBeNull()
    })

    it("returns phase=null and isLoading=true when vote-start block is not yet known", () => {
      // Round id and info "resolved" but the snapshot block isn't indexed yet — the
      // hasPastRound* memos would silently return false. isLoading must stay true.
      const result = resolveOnboardingPhase(
        baseInputs({
          isRoundIdLoading: false,
          isRoundInfoLoading: false,
          currentRoundVoteStartBlock: undefined,
        }),
      )
      expect(result.isLoading).toBe(true)
      expect(result.phase).toBeNull()
    })

    it("does not classify a graduated veteran as first-vote during the race window", () => {
      // The exact race the bug created: tx data is cached and resolved (so the indexer
      // would return past-round vote+claim once the block is known), but the round
      // snapshot block hasn't arrived. Before the fix, both hasPastRound* booleans
      // silently fell to false and phase came out as "first-vote".
      const racingInputs = baseInputs({
        currentRoundVoteStartBlock: undefined,
        isRoundIdLoading: false,
        isRoundInfoLoading: false,
        isVoteTxLoading: false,
        isClaimTxLoading: false,
        // What hasPastRound* would compute as during the race (false because the
        // memos early-return on missing block):
        hasPastRoundVote: false,
        hasPastRoundClaim: false,
      })
      const racing = resolveOnboardingPhase(racingInputs)
      expect(racing.isLoading).toBe(true)
      expect(racing.phase).toBeNull()

      // After the round data resolves, the hasPastRound* memos recompute against the
      // real block. The user is a graduated veteran → phase null, not loading.
      const resolved = resolveOnboardingPhase(
        baseInputs({
          currentRoundVoteStartBlock: VOTE_START_BLOCK,
          hasPastRoundVote: true,
          hasPastRoundClaim: true,
        }),
      )
      expect(resolved.isLoading).toBe(false)
      expect(resolved.phase).toBeNull()
    })
  })

  describe("happy-path classification (sanity)", () => {
    it("first-vote when eligible with no past-round activity", () => {
      const result = resolveOnboardingPhase(baseInputs())
      expect(result.phase).toBe("first-vote")
      expect(result.isLoading).toBe(false)
    })

    it("active-voter when eligible with past-round vote but no past-round claim", () => {
      const result = resolveOnboardingPhase(baseInputs({ hasPastRoundVote: true }))
      expect(result.phase).toBe("active-voter")
    })

    it("null (graduated) when eligible with past-round vote AND claim", () => {
      const result = resolveOnboardingPhase(baseInputs({ hasPastRoundVote: true, hasPastRoundClaim: true }))
      expect(result.phase).toBeNull()
      expect(result.isLoading).toBe(false)
    })

    it("onboarding when not eligible this round, even if past-round vote/claim exist", () => {
      const result = resolveOnboardingPhase(
        baseInputs({
          hasVotesAtSnapshot: false,
          hasPastRoundVote: true,
          hasPastRoundClaim: true,
        }),
      )
      expect(result.phase).toBe("onboarding")
    })
  })
})
