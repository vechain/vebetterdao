import { Skeleton, Alert, HStack, AlertDescription, Icon, Text, Stack } from "@chakra-ui/react"
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
  const colorSchemes = {
    [AlertType.warning]: {
      primaryColor: "#FFF3E5",
      secondaryColor: "#F29B32",
      icon: UilExclamationCircle,
    },
    [AlertType.error]: {
      primaryColor: "#FCEEF1",
      secondaryColor: "#C84968",
      icon: UilExclamationCircle,
    },
    [AlertType.success]: {
      primaryColor: "#E9FDF1",
      secondaryColor: "#3DBA67",
      icon: UilInfoCircle,
    },
    [AlertType.info]: {
      primaryColor: "#E5F3FF",
      secondaryColor: "#2E9FFF",
      icon: UilInfoCircle,
    },
  }

  const colorScheme = colorSchemes[type] || colorSchemes["info"]

  return (
    <Skeleton loading={isLoading}>
      <Alert bg={colorScheme.primaryColor} borderRadius="8px" my={3}>
        <Stack flexDir={title ? "column" : "row"}>
          <HStack w={title ? "full" : "auto"}>
            <Icon as={colorScheme.icon} boxSize={7} color={colorScheme.secondaryColor} />
            {title && (
              <Text fontWeight={600} color={colorScheme.secondaryColor} fontSize="md">
                {title}
              </Text>
            )}
          </HStack>
          <AlertDescription as="span" fontSize="sm" color="#6A6A6A" alignSelf={title ? "flex-start" : "center"}>
            {message}
          </AlertDescription>
        </Stack>
      </Alert>
    </Skeleton>
  )
}
