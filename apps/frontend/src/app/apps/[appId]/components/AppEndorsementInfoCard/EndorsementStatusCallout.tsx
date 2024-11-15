import { XAppStatus } from "@/types"
import { HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import { Trans, useTranslation } from "react-i18next"
import { useXAppStatusConfig } from "../../hooks"
import { useAppGracePeriodEndsAfterRound } from "@/api"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"

type Props = {
  endorsementStatus: XAppStatus
  showDescription?: boolean
  padding?: number
}

export const EndorsementStatusCallout = ({ endorsementStatus, showDescription = true, padding = 4 }: Props) => {
  const STATUS_CONFIG = useXAppStatusConfig()
  const { t } = useTranslation()

  const { app } = useCurrentAppInfo()
  const { roundId, isLoading, isCurrentRound, isNextRound } = useAppGracePeriodEndsAfterRound(app?.id ?? "")

  const roundReference = isCurrentRound ? "current round" : isNextRound ? "next round" : `round ${roundId}`

  const { title, description, backgroundColor, color, icon } = STATUS_CONFIG[endorsementStatus] ?? {
    title: t("Endorsement coming soon"),
    description: t("Endorsement details available from next round."),
    backgroundColor: "#F8F8F8",
    color: "#6A6A6A",
    icon: UilExclamationCircle,
  }

  return (
    <VStack flex="1" p={padding} borderRadius="8px" backgroundColor={backgroundColor}>
      <HStack w="full">
        <Icon as={icon} boxSize={6} color={color} />
        <Text fontSize="16px" fontWeight={600} color={color}>
          {title}
        </Text>
      </HStack>
      {showDescription && (
        <Skeleton isLoaded={!isLoading} w="full">
          <Text fontSize="14px" color="#6A6A6A">
            <Trans i18nKey={description as any} values={{ roundReference }} t={t} />
          </Text>
        </Skeleton>
      )}
    </VStack>
  )
}
