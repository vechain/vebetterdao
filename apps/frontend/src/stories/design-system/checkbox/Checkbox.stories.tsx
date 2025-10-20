import { Checkbox, VStack, HStack, Text, For } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

const meta = {
  title: "design-system/components/Checkbox",
  component: Checkbox.Root,
} satisfies Meta<typeof Checkbox.Root>

export default meta

const sizes = [
  { size: "sm", label: "Small (18px)" },
  { size: "md", label: "Medium (20px)" },
  { size: "lg", label: "Large (24px)" },
] as const

export const LightMode = () => (
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

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark" }
