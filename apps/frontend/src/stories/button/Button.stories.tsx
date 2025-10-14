import { Button, VStack, HStack, Text } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"

const meta = {
  title: "b3tr/components/Button",
  component: Button,
} satisfies Meta<typeof Button>

export default meta

export const AllVariants = () => (
  <VStack alignItems="flex-start" gap="8">
    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Primary</Text>
      <HStack gap="4">
        <Button variant="primary">Primary</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Secondary</Text>
      <HStack gap="4">
        <Button variant="secondary">Secondary</Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Tertiary</Text>
      <HStack gap="4">
        <Button variant="tertiary">Tertiary</Button>
        <Button variant="tertiary" disabled>
          Disabled
        </Button>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Negative</Text>
      <HStack gap="4">
        <Button variant="negative">Negative</Button>
        <Button variant="negative" disabled>
          Disabled
        </Button>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Link</Text>
      <HStack gap="4">
        <Button variant="link">Link</Button>
        <Button variant="link" disabled>
          Disabled
        </Button>
      </HStack>
    </VStack>
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
