import { Badge, HStack, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuGlobe, LuLock, LuSparkles } from "react-icons/lu"

import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeVisibility,
  ChallengeView,
  challengeStatusLabel,
  challengeVisibilityLabel,
} from "@/api/challenges/types"
import { useChallengeStatusTime } from "@/api/challenges/useChallengeStatusTime"

import { getChallengeStatusBadgeVariant, getChallengeVisibilityBadgeVariant } from "./challengeBadgeVariants"
import { SponsoredChallengeInfo } from "./SponsoredChallengeInfo"

export const ChallengeVisibilityBadge = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const isPrivate = challenge.visibility === ChallengeVisibility.Private

  if (challenge.kind === ChallengeKind.Sponsored) {
    return (
      <>
        <Badge variant="yellow" size="sm">
          <Icon as={LuSparkles} />
          {t("Community Quest")}
        </Badge>
        {isPrivate && (
          <Badge variant="neutral" size="sm">
            <Icon as={LuLock} />
            {t(challengeVisibilityLabel(ChallengeVisibility.Private))}
          </Badge>
        )}
      </>
    )
  }

  const visibilityBadgeVariant = isPrivate ? "neutral" : getChallengeVisibilityBadgeVariant(challenge.visibility)

  return (
    <Badge variant={visibilityBadgeVariant} size="sm">
      <Icon as={isPrivate ? LuLock : LuGlobe} />
      {t(challengeVisibilityLabel(challenge.visibility))}
    </Badge>
  )
}

export const ChallengeKindBadges = ({ challenge }: { challenge: ChallengeView }) => {
  if (challenge.kind === ChallengeKind.Stake) return null

  return (
    <SponsoredChallengeInfo
      textProps={{ textStyle: "xs", color: "text.subtle", fontWeight: "semibold" }}
      iconSize="3.5"
    />
  )
}

export const ChallengeStatusBadge = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const statusTime = useChallengeStatusTime(challenge)

  const timeLabel = (() => {
    if (!statusTime) return null
    const time = statusTime.fromNow()
    switch (challenge.status) {
      case ChallengeStatus.Pending:
        return t("Starts {{time}}", { time })
      case ChallengeStatus.Active:
        return t("Ends {{time}}", { time })
      case ChallengeStatus.Finalized:
        return t("Ended {{time}}", { time })
      default:
        return null
    }
  })()

  return (
    <Badge variant={getChallengeStatusBadgeVariant(challenge.status)} size="sm">
      {timeLabel ?? t(challengeStatusLabel(challenge.status))}
    </Badge>
  )
}

export const ChallengeStatusBadges = ({ challenge }: { challenge: ChallengeView }) => (
  <HStack flexWrap="wrap" gap="2">
    <ChallengeKindBadges challenge={challenge} />
    <ChallengeVisibilityBadge challenge={challenge} />
    <ChallengeStatusBadge challenge={challenge} />
  </HStack>
)
