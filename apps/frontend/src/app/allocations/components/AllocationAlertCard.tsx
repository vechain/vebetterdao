import { Alert, HStack, VStack, Text } from "@chakra-ui/react"
import { InfoCircle, WarningCircle, CheckCircle, XmarkCircle } from "iconoir-react"
import { ReactNode } from "react"

export interface AllocationAlertCardProps {
  status: "info" | "warning" | "error" | "success" | "neutral"
  title?: string
  message: string | ReactNode
  icon?: ReactNode
}

const statusIcons = {
  info: InfoCircle,
  warning: WarningCircle,
  error: XmarkCircle,
  success: CheckCircle,
  neutral: InfoCircle,
}

const statusColors = {
  info: "status.info",
  warning: "status.warning",
  error: "status.negative",
  success: "status.positive",
  neutral: "status.neutral",
}

export const AllocationAlertCard = ({ status, title, message, icon }: AllocationAlertCardProps) => {
  const StatusIcon = statusIcons[status]

  return (
    <Alert.Root status={status} py={{ base: "2", md: "2.5" }} px={{ base: "3", md: "4" }}>
      <HStack alignItems="flex-start" gap="2" w="full">
        <Alert.Indicator boxSize={{ base: "4", md: "5" }} flexShrink={0} mt="0.5">
          {icon || <StatusIcon />}
        </Alert.Indicator>
        <VStack alignItems="flex-start" gap="1" flex={1}>
          {title && (
            <Text textStyle="sm" fontWeight="semibold" color={`${statusColors[status]}.strong`}>
              {title}
            </Text>
          )}
          {typeof message === "string" ? (
            <Text textStyle="sm" fontWeight="medium" color={`${statusColors[status]}.strong`}>
              {message}
            </Text>
          ) : (
            message
          )}
        </VStack>
      </HStack>
    </Alert.Root>
  )
}
