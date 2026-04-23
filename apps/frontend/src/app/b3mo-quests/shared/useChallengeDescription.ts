import { humanNumber } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

import { ChallengeKind, ChallengeStatus, ChallengeType, ChallengeView, SettlementMode } from "@/api/challenges/types"

export const useChallengeDescription = (challenge: ChallengeView): string => {
  const { t } = useTranslation()

  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const isStake = challenge.kind === ChallengeKind.Stake
  const isSplitWin = challenge.challengeType === ChallengeType.SplitWin

  // For Stake quests, the user's own stake adds to the pool when they join.
  // Once joined, totalPrize already includes their stake, so the win amount is just totalPrize.
  const totalPrizeNum = Number(challenge.totalPrize)
  const stakeAmountNum = Number(challenge.stakeAmount)
  const prizeAfterIJoin = isStake ? totalPrizeNum + stakeAmountNum : totalPrizeNum

  const prizeLabel = humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")
  const potentialLabel = humanNumber(prizeAfterIJoin, prizeAfterIJoin, "B3TR")
  const stakeLabel = humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")
  const perWinnerLabel = isSplitWin
    ? humanNumber(challenge.prizePerWinner, challenge.prizePerWinner, "B3TR")
    : prizeLabel
  const maxLabel = humanNumber(challenge.maxParticipants)
  const slotsLeft = Math.max(challenge.numWinners - challenge.winnersClaimed, 0)
  // Max Actions splits the pool equally across tied top scorers (matches contract _payoutAmount).
  const claimShare =
    challenge.settlementMode === SettlementMode.TopWinners && challenge.bestCount > 1
      ? (BigInt(challenge.totalPrize) / BigInt(challenge.bestCount)).toString()
      : challenge.totalPrize
  const claimPrizeLabel = humanNumber(claimShare, claimShare, "B3TR")

  if (challenge.canClaim) return t("You won! {{prize}} is yours — claim your prize now.", { prize: claimPrizeLabel })
  if (challenge.canClaimSplitWin)
    return t("You hit the threshold! Claim {{prize}} now — {{slots}} slots remaining.", {
      prize: perWinnerLabel,
      slots: slotsLeft,
    })
  if (challenge.canRefund)
    return t("B3MO Quest ended — your {{stake}} stake is ready to be refunded.", { stake: stakeLabel })
  if (challenge.canClaimCreatorSplitWinRefund)
    return t("{{slots}} slots went unclaimed — refund the unused pool.", { slots: slotsLeft })
  if (challenge.status === ChallengeStatus.Completed)
    return t("B3MO Quest complete — {{prize}} has been distributed to the winners.", { prize: prizeLabel })
  if (challenge.status === ChallengeStatus.Cancelled)
    return t("This B3MO quest was cancelled. Stakes have been refunded.")
  if (challenge.isJoined) {
    if (isSplitWin)
      return t("You're in! Reach {{threshold}} actions to claim {{prize}} — {{slots}} slots remaining.", {
        threshold: challenge.threshold,
        prize: perWinnerLabel,
        slots: slotsLeft,
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
    if (isSplitWin)
      return t("You've been invited! Reach {{threshold}} actions to claim {{prize}}.", {
        threshold: challenge.threshold,
        prize: perWinnerLabel,
      })
    if (isSponsored)
      return t("You've been invited! {{prize}} up for grabs — accept and join the action.", { prize: prizeLabel })
    return t("You've been invited! Stake {{stake}} for a shot at {{prize}} — accept to join.", {
      stake: stakeLabel,
      prize: potentialLabel,
    })
  }
  if (isSplitWin)
    return t("{{prize}} per winner — {{winners}} slots, reach {{threshold}} actions to claim. No stake needed.", {
      prize: perWinnerLabel,
      winners: challenge.numWinners,
      threshold: challenge.threshold,
    })
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
