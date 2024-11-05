import { XAppStatus } from "@/types"
import { Box, HStack, Icon, Text } from "@chakra-ui/react"
import { UilCheckCircle, UilExclamationCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

type ConfigType = {
  title: string
  description: string
  backgroundColor: string
  color: string
  icon: typeof UilExclamationCircle | typeof UilCheckCircle
}

type Props = {
  endorsementStatus: XAppStatus
}

export const EndorsementStatusCallout = ({ endorsementStatus }: Props) => {
  const { t } = useTranslation()

  const STATUS_CONFIG: Partial<Record<XAppStatus, ConfigType>> = {
    [XAppStatus.LOOKING_FOR_ENDORSEMENT]: {
      title: t("Looking for endorsement"),
      description: t("This app needs to be endorsed by X-node holders to enter allocation rounds."),
      backgroundColor: "#FFF3E5",
      color: "#F29B32",
      icon: UilExclamationCircle,
    },
    [XAppStatus.ENDORSED_NOT_ELIGIBLE]: {
      title: t("Endorsed"),
      description: t("This app has enough score and will participate in the next allocation rounds."),
      backgroundColor: "#E9FDF1",
      color: "#3DBA67",
      icon: UilCheckCircle,
    },
    [XAppStatus.ENDORSED_AND_ELIGIBLE]: {
      title: t("Endorsed and active"),
      description: t("This app has enough score and is participating in allocation rounds."),
      backgroundColor: "#E9FDF1",
      color: "#3DBA67",
      icon: UilCheckCircle,
    },
    [XAppStatus.UNENDORSED_AND_ELIGIBLE]: {
      title: t("In grace period"),
      description: t(
        "This app will participate in allocation rounds #X and #X. After that, it will only continue to participate if it has enough endorsement score.",
      ),
      backgroundColor: "#FFF3E5",
      color: "#F29B32",
      icon: UilExclamationCircle,
    },
    [XAppStatus.UNENDORSED_NOT_ELIGIBLE]: {
      title: t("Endorsement lost"),
      description: t(
        "This app lost its score and won’t participate in allocation rounds until it gets endorsed again.",
      ),
      backgroundColor: "#FCEEF1",
      color: "#C84968",
      icon: UilExclamationCircle,
    },
  }

  const { title, description, backgroundColor, color, icon } = STATUS_CONFIG[endorsementStatus] ?? {
    title: "Unknown status",
    description: "The endorsement status of this app is unknown.",
    backgroundColor: "#F8F8F8",
    color: "#6A6A6A",
    icon: UilExclamationCircle,
  }

  return (
    <Box w="full" p={4} borderRadius="8px" backgroundColor={backgroundColor}>
      <HStack>
        <Text fontWeight={600} color={color}>
          {title}
        </Text>
        <Icon as={icon} boxSize={30} color={color} />
      </HStack>
      <Text>{description}</Text>
    </Box>
  )
}
