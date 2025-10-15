import { Button, VStack, HStack, Text, For } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"

const meta = {
  title: "b3tr/components/Button",
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

export const AllVariants = () => (
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

export const Primary = () => (
  <HStack gap="4">
    <Button variant="primary">Primary</Button>
    <Button variant="primary" disabled>
      Disabled
    </Button>
  </HStack>
)

export const Secondary = () => (
  <HStack gap="4">
    <Button variant="secondary">Secondary</Button>
    <Button variant="secondary" disabled>
      Disabled
    </Button>
  </HStack>
)

export const Tertiary = () => (
  <HStack gap="4">
    <Button variant="tertiary">Tertiary</Button>
    <Button variant="tertiary" disabled>
      Disabled
    </Button>
  </HStack>
)

export const Negative = () => (
  <HStack gap="4">
    <Button variant="negative">Negative</Button>
    <Button variant="negative" disabled>
      Disabled
    </Button>
  </HStack>
)

export const Link = () => (
  <HStack gap="4">
    <Button variant="link">Link</Button>
    <Button variant="link" disabled>
      Disabled
    </Button>
  </HStack>
)
