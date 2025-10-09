import { Alert, Icon, VStack } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import { Meta } from "@storybook/nextjs-vite"

const meta = {
  title: "b3tr/components/Alert",
  component: Alert.Root,
} satisfies Meta<typeof Alert.Root>
export default meta

const STATUSES = ["info", "success", "warning", "error"] as const

export const Default = () => (
  <VStack gap="4">
    {STATUSES.map(status => (
      <Alert.Root key={status} status={status}>
        <Alert.Indicator>
          <Icon as={UilExclamationCircle} />
        </Alert.Indicator>
        <Alert.Title>{status}</Alert.Title>
      </Alert.Root>
    ))}
  </VStack>
)
