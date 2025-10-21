import { Switch, VStack, HStack, Text, For } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

const meta = {
  title: "design-system/components/Switch",
  component: Switch.Root,
} satisfies Meta<typeof Switch.Root>

export default meta

const sizes = [
  { size: "sm", label: "Small" },
  { size: "md", label: "Medium" },
  { size: "lg", label: "Large" },
] as const

export const LightMode = () => (
  <VStack alignItems="flex-start" gap="8">
    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">All Sizes</Text>
      <HStack gap="4">
        <For each={sizes}>
          {({ size, label }) => (
            <Switch.Root size={size}>
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Label>{label}</Switch.Label>
            </Switch.Root>
          )}
        </For>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Checked State</Text>
      <HStack gap="4">
        <Switch.Root size="md" defaultChecked>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Checked</Switch.Label>
        </Switch.Root>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Invalid State</Text>
      <HStack gap="4">
        <Switch.Root size="md" invalid>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Invalid</Switch.Label>
        </Switch.Root>
      </HStack>
    </VStack>

    <VStack alignItems="flex-start" gap="4">
      <Text fontWeight="bold">Disabled State</Text>
      <HStack gap="4">
        <Switch.Root size="md" disabled>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Disabled</Switch.Label>
        </Switch.Root>
        <Switch.Root size="md" disabled defaultChecked>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Disabled Checked</Switch.Label>
        </Switch.Root>
      </HStack>
    </VStack>
  </VStack>
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark" }
