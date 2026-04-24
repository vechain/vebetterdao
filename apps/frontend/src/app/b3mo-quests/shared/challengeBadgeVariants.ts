import { ChallengeKind, ChallengeStatus, ChallengeView } from "@/api/challenges/types"

type ChallengeBadgeVariant = "positive" | "warning" | "negative" | "neutral" | "info" | "teal" | "yellow"

export const getChallengeKindBadgeVariant = (kind: ChallengeKind): ChallengeBadgeVariant =>
  kind === ChallengeKind.Stake ? "teal" : "yellow"

export const getChallengeStatusBadgeVariant = (challenge: ChallengeView): ChallengeBadgeVariant => {
  if (challenge.canComplete || challenge.status === ChallengeStatus.Completed) return "info"
  switch (challenge.status) {
    case ChallengeStatus.Pending:
      return "warning"
    case ChallengeStatus.Active:
      return "positive"
    case ChallengeStatus.Cancelled:
    case ChallengeStatus.Invalid:
      return "negative"
    default:
      return "neutral"
  }
}
