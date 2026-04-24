import { Badge, HStack, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { LuLock, LuSparkles, LuCoins, LuScale } from "react-icons/lu"

import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeType,
  ChallengeVisibility,
  ChallengeView,
  challengeStatusLabel,
} from "@/api/challenges/types"
import { useChallengeStatusTime } from "@/api/challenges/useChallengeStatusTime"

import { getChallengeStatusBadgeVariant } from "./challengeBadgeVariants"
import { SponsoredChallengeInfo } from "./SponsoredChallengeInfo"

export const ChallengeVisibilityBadge = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const sponsoredCreator = challenge.kind === ChallengeKind.Sponsored && challenge.isCreator
  const sponsoredUser = challenge.kind === ChallengeKind.Sponsored && !challenge.isCreator
  return (
    <>
      {sponsoredCreator && (
        <Badge variant="yellow" size="sm">
          <Icon as={LuSparkles} />
          {t("Sponsored")}
        </Badge>
      )}
      {sponsoredUser && (
        <Badge variant="positive" size="sm">
          <Icon as={LuCoins} />
          {t("Free entry")}
        </Badge>
      )}
      {challenge.visibility === ChallengeVisibility.Private && (
        <Badge variant={"neutral"} size="sm">
          <Icon as={LuLock} />
          {t("Private")}
        </Badge>
      )}
    </>
  )
}

export const ChallengeWinnerTypeBadge = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const isSplitWin = challenge.challengeType === ChallengeType.SplitWin
  return (
    <Badge variant={isSplitWin ? "info" : "purple"} size="sm">
      <Icon as={LuScale} />
      {t(isSplitWin ? "Split win" : "Max actions")}
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

export const ChallengeStatusBadge = ({
  challenge,
  outlined = false,
}: {
  challenge: ChallengeView
  outlined?: boolean
}) => {
  const { t } = useTranslation()
  const statusTime = useChallengeStatusTime(challenge)

  const isEnded = challenge.canComplete || challenge.status === ChallengeStatus.Completed
  const timeLabel = (() => {
    if (isEnded) return t("Ended")
    if (!statusTime) return null
    const time = statusTime.fromNow()
    const opts = { time, interpolation: { escapeValue: false } }
    switch (challenge.status) {
      case ChallengeStatus.Pending:
        return t("Starts {{time}}", opts)
      case ChallengeStatus.Active:
        return t("Ends {{time}}", opts)
      default:
        return null
    }
  })()

  return (
    <Badge
      variant={getChallengeStatusBadgeVariant(challenge)}
      size="sm"
      {...(outlined && { bg: "transparent", borderWidth: "1px", borderColor: "currentColor" })}>
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
