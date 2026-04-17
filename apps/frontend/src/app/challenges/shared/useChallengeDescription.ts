import { humanNumber } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

import { ChallengeKind, ChallengeStatus, ChallengeView, ThresholdMode } from "@/api/challenges/types"

export const useChallengeDescription = (challenge: ChallengeView): string => {
  const { t } = useTranslation()

  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const isStake = challenge.kind === ChallengeKind.Stake
  const isSplit = isSponsored && challenge.thresholdMode === ThresholdMode.SplitAboveThreshold

  // For Stake quests, the user's own stake adds to the pool when they join.
  // Once joined, totalPrize already includes their stake, so the win amount is just totalPrize.
  const totalPrizeNum = Number(challenge.totalPrize)
  const stakeAmountNum = Number(challenge.stakeAmount)
  const prizeAfterIJoin = isStake ? totalPrizeNum + stakeAmountNum : totalPrizeNum

  // For Sponsored Split quests, prize is divided across qualified winners.
  // Pre-finalization we estimate using participantCount; +1 if the user would be a new participant.
  const splitDivisor = Math.max(challenge.participantCount + (challenge.isJoined ? 0 : 1), 1)
  const perWinnerCurrent = Math.floor(totalPrizeNum / Math.max(challenge.participantCount, 1))
  const perWinnerAfterIJoin = Math.floor(prizeAfterIJoin / splitDivisor)

  const prizeLabel = humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")
  const potentialLabel = humanNumber(prizeAfterIJoin, prizeAfterIJoin, "B3TR")
  const stakeLabel = humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")
  const perWinnerCurrentLabel = humanNumber(perWinnerCurrent, perWinnerCurrent, "B3TR")
  const perWinnerAfterIJoinLabel = humanNumber(perWinnerAfterIJoin, perWinnerAfterIJoin, "B3TR")
  const maxLabel = humanNumber(challenge.maxParticipants)

  if (challenge.canClaim) return t("You won! {{prize}} is yours — claim your prize now.", { prize: prizeLabel })
  if (challenge.canRefund)
    return t("Quest ended — your {{stake}} stake is ready to be refunded.", { stake: stakeLabel })
  if (challenge.status === ChallengeStatus.Finalized)
    return t("Quest complete — {{prize}} has been distributed to the winners.", { prize: prizeLabel })
  if (challenge.status === ChallengeStatus.Cancelled) return t("This quest was cancelled. Stakes have been refunded.")
  if (challenge.isJoined) {
    if (isSplit)
      return t("You're in! Compete for up to {{prize}} per winner — {{duration}} rounds to prove yourself.", {
        prize: perWinnerCurrentLabel,
        duration: challenge.duration,
      })
    if (isSponsored)
      return t("You're in! Compete for {{prize}} — {{duration}} rounds to prove yourself.", {
        prize: prizeLabel,
        duration: challenge.duration,
      })
    return t("You're in! {{stake}} staked — compete for {{prize}} over {{duration}} rounds.", {
      stake: stakeLabel,
      prize: prizeLabel,
      duration: challenge.duration,
    })
  }
  if (challenge.canAccept) {
    if (isSplit)
      return t("You've been invited! Up to {{prize}} per winner — accept and join the action.", {
        prize: perWinnerAfterIJoinLabel,
      })
    if (isSponsored)
      return t("You've been invited! {{prize}} up for grabs — accept and join the action.", { prize: prizeLabel })
    return t("You've been invited! Stake {{stake}} for a shot at {{prize}} — accept to join.", {
      stake: stakeLabel,
      prize: potentialLabel,
    })
  }
  if (isSplit)
    return t(
      "Up to {{prize}} per winner — {{max}} slots, {{duration}} rounds. No stake needed, just bring your A-game.",
      { prize: perWinnerAfterIJoinLabel, max: maxLabel, duration: challenge.duration },
    )
  if (isSponsored)
    return t("{{prize}} up for grabs — {{max}} slots, {{duration}} rounds. No stake needed, just bring your A-game.", {
      prize: prizeLabel,
      max: maxLabel,
      duration: challenge.duration,
    })
  return t(
    "Put {{stake}} on the line for a shot at {{prize}} — {{max}} players, {{duration}} rounds, one winner takes all.",
    { stake: stakeLabel, prize: potentialLabel, max: maxLabel, duration: challenge.duration },
  )
}
