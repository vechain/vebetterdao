import { ChallengeKind, ChallengeStatus, ChallengeVisibility } from "@/api/challenges/types"

type ChallengeBadgeVariant = "positive" | "warning" | "negative" | "neutral" | "info"

export const getChallengeKindBadgeVariant = (kind: ChallengeKind): ChallengeBadgeVariant =>
  kind === ChallengeKind.Stake ? "neutral" : "info"

export const getChallengeVisibilityBadgeVariant = (visibility: ChallengeVisibility): ChallengeBadgeVariant =>
  visibility === ChallengeVisibility.Public ? "info" : "neutral"

export const getChallengeStatusBadgeVariant = (status: ChallengeStatus): ChallengeBadgeVariant => {
  switch (status) {
    case ChallengeStatus.Pending:
      return "warning"
    case ChallengeStatus.Active:
      return "positive"
    case ChallengeStatus.Finalizing:
      return "info"
    case ChallengeStatus.Finalized:
      return "neutral"
    case ChallengeStatus.Cancelled:
    case ChallengeStatus.Invalid:
      return "negative"
  }
}
