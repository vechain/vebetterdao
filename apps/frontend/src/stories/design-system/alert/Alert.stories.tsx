import { Alert, Icon, VStack, For } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

const meta = {
  title: "design-system/components/Alert",
  component: Alert.Root,
} satisfies Meta<typeof Alert.Root>
export default meta

const statuses = ["info", "success", "warning", "error"] as const

export const LightMode = () => (
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

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark" }
