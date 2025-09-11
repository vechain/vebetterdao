import type { Meta } from "@storybook/nextjs-vite"

import { Button, VStack } from "@chakra-ui/react"

const meta = {
  title: "b3tr/components/Button",
  component: Button,
} satisfies Meta<typeof Button>

export default meta

export const Default = () => (
  <VStack alignItems="flex-start" gap="4">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
  </VStack>
)
