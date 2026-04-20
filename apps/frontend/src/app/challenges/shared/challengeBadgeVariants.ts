import { ChallengeKind, ChallengeStatus } from "@/api/challenges/types"

type ChallengeBadgeVariant = "positive" | "warning" | "negative" | "neutral" | "info" | "teal" | "yellow"

export const getChallengeKindBadgeVariant = (kind: ChallengeKind): ChallengeBadgeVariant =>
  kind === ChallengeKind.Stake ? "teal" : "yellow"

export const getChallengeStatusBadgeVariant = (status: ChallengeStatus): ChallengeBadgeVariant => {
  switch (status) {
    case ChallengeStatus.Pending:
      return "warning"
    case ChallengeStatus.Active:
      return "positive"
    case ChallengeStatus.Finalized:
      return "neutral"
    case ChallengeStatus.Cancelled:
    case ChallengeStatus.Invalid:
      return "negative"
  }
}
