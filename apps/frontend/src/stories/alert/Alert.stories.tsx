import { Alert, Icon, VStack } from "@chakra-ui/react"
import { UilExclamationCircle, UilCheckCircle, UilInfoCircle, UilExclamationTriangle } from "@iconscout/react-unicons"
import { Meta } from "@storybook/nextjs-vite"

const meta = {
  title: "b3tr/components/Alert",
  component: Alert.Root,
} satisfies Meta<typeof Alert.Root>
export default meta

const STATUSES = ["info", "success", "warning", "error", "neutral"] as const

const statusIcons = {
  info: UilInfoCircle,
  success: UilCheckCircle,
  warning: UilExclamationTriangle,
  error: UilExclamationCircle,
  neutral: UilInfoCircle,
}

export const AllStatuses = () => (
  <VStack gap="4" width="full">
    {STATUSES.map(status => (
      <Alert.Root key={status} status={status} width="full">
        <Alert.Indicator>
          <Icon as={statusIcons[status]} />
        </Alert.Indicator>
        <Alert.Title>This is a toast message.</Alert.Title>
      </Alert.Root>
    ))}
  </VStack>
)

export const WithoutIcon = () => (
  <VStack gap="4" width="full">
    {STATUSES.map(status => (
      <Alert.Root key={status} status={status} width="full">
        <Alert.Title>This is a toast message.</Alert.Title>
      </Alert.Root>
    ))}
  </VStack>
)

export const Default = AllStatuses
