import { Button, VStack, HStack, Text, For } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

const meta = {
  title: "design-system/components/Button",
  component: Button,
} satisfies Meta<typeof Button>

export default meta

const variants = [
  { name: "Primary", variant: "primary" },
  { name: "Secondary", variant: "secondary" },
  { name: "Tertiary", variant: "tertiary" },
  { name: "Negative", variant: "negative" },
  { name: "Link", variant: "link" },
] as const

export const LightMode = () => (
  <VStack alignItems="flex-start" gap="8">
    <For each={variants}>
      {({ name, variant }) => (
        <VStack alignItems="flex-start" gap="4">
          <Text fontWeight="bold">{name}</Text>
          <HStack gap="4">
            <Button variant={variant}>{name}</Button>
            <Button variant={variant} disabled>
              Disabled
            </Button>
          </HStack>
        </VStack>
      )}
    </For>
  </VStack>
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark" }
