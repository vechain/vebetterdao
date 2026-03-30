"use client"

import { Badge, HStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeVisibility,
  ChallengeView,
  challengeKindLabel,
  challengeStatusLabel,
  challengeVisibilityLabel,
} from "@/api/challenges/types"

import {
  getChallengeKindBadgeVariant,
  getChallengeStatusBadgeVariant,
  getChallengeVisibilityBadgeVariant,
} from "./challengeBadgeVariants"

export const ChallengeStatusBadges = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const kindBadgeVariant = isSponsored ? "positive" : getChallengeKindBadgeVariant(challenge.kind)
  const visibilityBadgeVariant =
    challenge.visibility === ChallengeVisibility.Private
      ? "neutral"
      : getChallengeVisibilityBadgeVariant(challenge.visibility)
  const showStatusBadge = challenge.status !== ChallengeStatus.Active

  return (
    <HStack flexWrap="wrap" gap="2">
      <Badge variant={kindBadgeVariant} size="sm">
        {t(challengeKindLabel(challenge.kind))}
      </Badge>
      <Badge variant={visibilityBadgeVariant} size="sm">
        {t(challengeVisibilityLabel(challenge.visibility))}
      </Badge>
      {showStatusBadge && (
        <Badge variant={getChallengeStatusBadgeVariant(challenge.status)} size="sm">
          {t(challengeStatusLabel(challenge.status))}
        </Badge>
      )}
    </HStack>
  )
}
