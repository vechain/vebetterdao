import type { Meta } from "@storybook/nextjs-vite"

import { Badge, For, VStack } from "@chakra-ui/react"

const meta = {
  title: "b3tr/components/Badge",
  component: Badge,
} satisfies Meta<typeof Badge>

export default meta

const variants = ["warning", "info", "error", "neutral", "success", "outline"] as const

export const Default = () => (
  <VStack alignItems="flex-start" gap="4">
    <For each={variants}>{variant => <Badge variant={variant}>{variant}</Badge>}</For>
  </VStack>
)
