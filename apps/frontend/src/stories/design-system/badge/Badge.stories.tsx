import { Badge, For, VStack } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

const meta = {
  title: "design-system/components/Badge",
  component: Badge,
} satisfies Meta<typeof Badge>
export default meta

const variants = ["warning", "info", "negative", "neutral", "positive", "outline"] as const

export const LightMode = () => (
  <VStack alignItems="flex-start" gap="4">
    <For each={variants}>{variant => <Badge variant={variant}>{variant}</Badge>}</For>
  </VStack>
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark" }
