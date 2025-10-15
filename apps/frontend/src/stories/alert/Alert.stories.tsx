import { Alert, Icon, VStack, For } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import { Meta } from "@storybook/nextjs-vite"

const meta = {
  title: "b3tr/components/Alert",
  component: Alert.Root,
} satisfies Meta<typeof Alert.Root>
export default meta

const statuses = ["info", "success", "warning", "error"] as const

export const Default = () => (
  <VStack gap="4">
    <For each={statuses}>
      {status => (
        <Alert.Root status={status}>
          <Alert.Indicator>
            <Icon as={UilExclamationCircle} />
          </Alert.Indicator>
          <Alert.Title>{status}</Alert.Title>
        </Alert.Root>
      )}
    </For>
  </VStack>
)
