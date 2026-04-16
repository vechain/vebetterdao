import { Badge, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import {
  ChallengeKind,
  ChallengeVisibility,
  ChallengeView,
  challengeStatusLabel,
  challengeVisibilityLabel,
} from "@/api/challenges/types"

import { getChallengeStatusBadgeVariant, getChallengeVisibilityBadgeVariant } from "./challengeBadgeVariants"
import { SponsoredChallengeInfo } from "./SponsoredChallengeInfo"

export const ChallengeVisibilityBadge = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const visibilityBadgeVariant =
    challenge.visibility === ChallengeVisibility.Private
      ? "neutral"
      : getChallengeVisibilityBadgeVariant(challenge.visibility)

  return (
    <Badge variant={visibilityBadgeVariant} size="sm">
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

  return (
    <Badge variant={getChallengeStatusBadgeVariant(challenge.status)} size="sm">
      {t(challengeStatusLabel(challenge.status))}
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
