import type { TFunction } from "i18next"

import { ChallengeKind, ChallengeStatus, type ChallengeView } from "@/api/challenges/types"

type InvalidReasonInput = Pick<ChallengeView, "status" | "kind" | "participantCount">

export const getChallengeInvalidReason = (challenge: InvalidReasonInput, t: TFunction): string | null => {
  if (challenge.status !== ChallengeStatus.Invalid) return null

  if (challenge.kind === ChallengeKind.Stake) {
    return t("Quest invalidated: needed at least 2 participants but only {{count}} joined.", {
      count: challenge.participantCount,
    })
  }

  return t("Quest invalidated: no participants joined before it started.")
}
