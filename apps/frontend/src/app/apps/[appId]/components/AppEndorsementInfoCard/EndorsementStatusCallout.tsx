import { XAppStatus } from "@/types"
import { Box, HStack, Icon, Text } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import { useXAppStatusConfig } from "../../hooks"

type Props = {
  endorsementStatus: XAppStatus
  showDescription?: boolean
  padding?: number
}

export const EndorsementStatusCallout = ({ endorsementStatus, showDescription = true, padding = 4 }: Props) => {
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
          {description}
        </Text>
      )}
    </Box>
  )
}
