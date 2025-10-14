import { Checkbox, VStack, HStack, Text } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"

const meta = {
  title: "b3tr/components/Checkbox",
  component: Checkbox.Root,
} satisfies Meta<typeof Checkbox.Root>

export default meta

export const AllSizesAndStates = () => (
  <VStack alignItems="flex-start" gap="8">
    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">All Sizes</Text>
      <HStack gap="4">
        <Checkbox.Root size="sm">
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Small (18px)</Checkbox.Label>
        </Checkbox.Root>
        <Checkbox.Root size="md">
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Medium (20px)</Checkbox.Label>
        </Checkbox.Root>
        <Checkbox.Root size="lg">
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Large (24px)</Checkbox.Label>
        </Checkbox.Root>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Checked State</Text>
      <HStack gap="4">
        <Checkbox.Root size="md" defaultChecked>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Checked</Checkbox.Label>
        </Checkbox.Root>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Disabled States</Text>
      <HStack gap="4">
        <Checkbox.Root size="md" disabled>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Disabled Unchecked</Checkbox.Label>
        </Checkbox.Root>
        <Checkbox.Root size="md" disabled defaultChecked>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Disabled Checked</Checkbox.Label>
        </Checkbox.Root>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Hover States (Hover to see)</Text>
      <HStack gap="4">
        <Checkbox.Root size="md">
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Hover Unchecked</Checkbox.Label>
        </Checkbox.Root>
        <Checkbox.Root size="md" defaultChecked>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>Hover Checked</Checkbox.Label>
        </Checkbox.Root>
      </HStack>
    </VStack>
  </VStack>
)

export const States = () => (
  <VStack alignItems="flex-start" gap="4">
    <HStack gap="4">
      <Checkbox.Root size="md">
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Unchecked</Checkbox.Label>
      </Checkbox.Root>
      <Checkbox.Root size="md" defaultChecked>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Checked</Checkbox.Label>
      </Checkbox.Root>
      <Checkbox.Root size="md" disabled>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Disabled</Checkbox.Label>
      </Checkbox.Root>
    </HStack>
  </VStack>
)

export const Sizes = () => (
  <VStack alignItems="flex-start" gap="4">
    <Checkbox.Root size="sm">
      <Checkbox.HiddenInput />
      <Checkbox.Control />
      <Checkbox.Label>Small (18px)</Checkbox.Label>
    </Checkbox.Root>
    <Checkbox.Root size="md">
      <Checkbox.HiddenInput />
      <Checkbox.Control />
      <Checkbox.Label>Medium (20px)</Checkbox.Label>
    </Checkbox.Root>
    <Checkbox.Root size="lg">
      <Checkbox.HiddenInput />
      <Checkbox.Control />
      <Checkbox.Label>Large (24px)</Checkbox.Label>
    </Checkbox.Root>
  </VStack>
)

export const WithoutLabel = () => (
  <HStack gap="4">
    <Checkbox.Root size="md">
      <Checkbox.HiddenInput />
      <Checkbox.Control />
    </Checkbox.Root>
    <Checkbox.Root size="md" defaultChecked>
      <Checkbox.HiddenInput />
      <Checkbox.Control />
    </Checkbox.Root>
  </HStack>
)

export const CheckedStates = () => (
  <VStack alignItems="flex-start" gap="4">
    <HStack gap="4">
      <Checkbox.Root size="sm" defaultChecked>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Small Checked</Checkbox.Label>
      </Checkbox.Root>
    </HStack>
    <HStack gap="4">
      <Checkbox.Root size="md" defaultChecked>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Medium Checked</Checkbox.Label>
      </Checkbox.Root>
    </HStack>
    <HStack gap="4">
      <Checkbox.Root size="lg" defaultChecked>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Large Checked</Checkbox.Label>
      </Checkbox.Root>
    </HStack>
  </VStack>
)

export const DisabledStates = () => (
  <VStack alignItems="flex-start" gap="4">
    <HStack gap="4">
      <Checkbox.Root size="md" disabled>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Disabled Unchecked</Checkbox.Label>
      </Checkbox.Root>
    </HStack>
    <HStack gap="4">
      <Checkbox.Root size="md" disabled defaultChecked>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>Disabled Checked</Checkbox.Label>
      </Checkbox.Root>
    </HStack>
  </VStack>
)
