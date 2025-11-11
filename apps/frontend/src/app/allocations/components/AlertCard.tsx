import { Card, Icon, Text, HStack, VStack, type CardRootProps } from "@chakra-ui/react"
import { InfoCircle, WarningCircle, CheckCircle, XmarkCircle } from "iconoir-react"
import { ReactNode } from "react"

export interface AlertCardProps extends Omit<CardRootProps, "variant"> {
  status: "info" | "warning" | "error" | "success"
  title?: string
  message: string | ReactNode
  icon?: ReactNode
}

const statusIcons = {
  info: InfoCircle,
  warning: WarningCircle,
  error: XmarkCircle,
  success: CheckCircle,
}

const statusColors = {
  info: "alert.info",
  warning: "alert.warning",
  error: "alert.error",
  success: "alert.success",
}

export const AlertCard = ({ status, title, message, icon, ...props }: AlertCardProps) => {
  const StatusIcon = statusIcons[status]

  return (
    <Card.Root
      py="3"
      px="4"
      variant="subtle"
      bgColor={`${statusColors[status]}.subtle`}
      borderWidth="1px"
      borderStyle="solid"
      borderColor={`${statusColors[status]}.secondary`}
      borderRadius="lg"
      {...props}>
      <HStack alignItems="flex-start" gap="2">
        <Icon
          boxSize={{ base: "5", md: "6" }}
          color={`${statusColors[status]}.strong`}
          flexShrink={0}
          mt={{ base: "0.5", md: "1" }}>
          {icon || <StatusIcon />}
        </Icon>
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
    </Card.Root>
  )
}
