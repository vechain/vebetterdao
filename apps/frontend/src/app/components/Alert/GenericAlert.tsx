import { Alert, HStack, Icon, Skeleton, Stack } from "@chakra-ui/react"
import { UilExclamationCircle, UilInfoCircle } from "@iconscout/react-unicons"

enum AlertType {
  success = "success",
  warning = "warning",
  error = "error",
  info = "info",
}
type Props = {
  isLoading: boolean
  title?: string
  message: string
  type: AlertType | keyof typeof AlertType // Allow both enum and string
}
export const GenericAlert = ({ isLoading = false, title, message, type }: Props) => {
  const iconMap = {
    [AlertType.warning]: UilExclamationCircle,
    [AlertType.error]: UilExclamationCircle,
    [AlertType.success]: UilInfoCircle,
    [AlertType.info]: UilInfoCircle,
  }
  const IconComponent = iconMap[type] || iconMap.info
  return (
    <Skeleton loading={isLoading}>
      <Alert.Root status={type} my={3}>
        <Stack flexDir={title ? "column" : "row"} w="full">
          <HStack w={title ? "full" : "auto"}>
            <Alert.Indicator>
              <Icon as={IconComponent} boxSize={7} />
            </Alert.Indicator>
            {title && <Alert.Title>{title}</Alert.Title>}
          </HStack>
          <Alert.Description alignSelf={title ? "flex-start" : "center"}>{message}</Alert.Description>
        </Stack>
      </Alert.Root>
    </Skeleton>
  )
}
