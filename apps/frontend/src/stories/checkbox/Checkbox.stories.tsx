import { Checkbox, VStack, HStack, Text, For } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"

const meta = {
  title: "b3tr/components/Checkbox",
  component: Checkbox.Root,
} satisfies Meta<typeof Checkbox.Root>

export default meta

const sizes = [
  { size: "sm", label: "Small (18px)" },
  { size: "md", label: "Medium (20px)" },
  { size: "lg", label: "Large (24px)" },
] as const

export const AllSizesAndStates = () => (
  <VStack alignItems="flex-start" gap="8">
    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">All Sizes</Text>
      <HStack gap="4">
        <For each={sizes}>
          {({ size, label }) => (
            <Checkbox.Root size={size}>
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label>{label}</Checkbox.Label>
            </Checkbox.Root>
          )}
        </For>
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
    <For each={sizes}>
      {({ size, label }) => (
        <Checkbox.Root size={size}>
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label>{label}</Checkbox.Label>
        </Checkbox.Root>
      )}
    </For>
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
    <For each={sizes}>
      {({ size, label }) => (
        <HStack gap="4">
          <Checkbox.Root size={size} defaultChecked>
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>{label.replace(/\(.*\)/, "Checked")}</Checkbox.Label>
          </Checkbox.Root>
        </HStack>
      )}
    </For>
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
