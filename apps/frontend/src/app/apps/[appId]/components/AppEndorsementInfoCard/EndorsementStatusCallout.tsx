import { XAppStatus } from "@/types"
import { Box, HStack, Icon, Text } from "@chakra-ui/react"
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
  const { t } = useTranslation()

  const { app } = useCurrentAppInfo()
  const { roundId, isLoading, isCurrentRound, isNextRound } = useAppGracePeriodEndsAfterRound(app?.id ?? "")
  // TODO add console.log and guard the template against rendering wrong data
  console.log(
    "roundId %s, isLoading %s, isCurrentRound %s, isNextRound %s",
    roundId,
    isLoading,
    isCurrentRound,
    isNextRound,
  )
  const roundReference = isCurrentRound ? "current round" : isNextRound ? "next round" : `round ${roundId}`

  const STATUS_CONFIG = useXAppStatusConfig()
  const { title, description, backgroundColor, color, icon } = STATUS_CONFIG[endorsementStatus] ?? {
    title: "Unknown status",
    description: "The endorsement status of this app is unknown.",
    backgroundColor: "#F8F8F8",
    color: "#6A6A6A",
    icon: UilExclamationCircle,
  }

  return (
    <Box w="full" p={padding} borderRadius="8px" backgroundColor={backgroundColor}>
      <HStack w="full">
        <Icon as={icon} boxSize={6} color={color} />
        <Text fontSize="16px" fontWeight={600} color={color}>
          {title}
        </Text>
      </HStack>
      {showDescription && (
        <Text fontSize="14px" color="#6A6A6A">
          <Trans i18nKey={description as any} values={{ roundReference }} t={t} />
        </Text>
      )}
    </Box>
  )
}
