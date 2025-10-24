import { Tabs, VStack, Text, For } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

const meta = {
  title: "design-system/components/Tabs",
  component: Tabs.Root,
} satisfies Meta<typeof Tabs.Root>

export default meta

const lineVariants = [
  { name: "Line - Small", variant: "line" as const, size: "sm" as const },
  { name: "Line - Medium", variant: "line" as const, size: "md" as const },
  { name: "Line - Large", variant: "line" as const, size: "lg" as const },
]

const subtleVariants = [
  {
    name: "Subtle (Primary) - Small",
    variant: "subtle" as const,
    size: "sm" as const,
    colorPalette: "actions.primary",
  },
  {
    name: "Subtle (Primary) - Medium",
    variant: "subtle" as const,
    size: "md" as const,
    colorPalette: "actions.primary",
  },
  {
    name: "Subtle (Primary) - Large",
    variant: "subtle" as const,
    size: "lg" as const,
    colorPalette: "actions.primary",
  },
  {
    name: "Subtle (Secondary) - Small",
    variant: "subtle" as const,
    size: "sm" as const,
    colorPalette: "actions.secondary",
  },
  {
    name: "Subtle (Secondary) - Medium",
    variant: "subtle" as const,
    size: "md" as const,
    colorPalette: "actions.secondary",
  },
  {
    name: "Subtle (Secondary) - Large",
    variant: "subtle" as const,
    size: "lg" as const,
    colorPalette: "actions.secondary",
  },
]

export const LightMode = () => (
  <VStack alignItems="flex-start" gap="8">
    <Text fontSize="xl" fontWeight="bold">
      Line Variant
    </Text>
    <For each={lineVariants}>
      {({ name, variant, size }) => (
        <VStack alignItems="flex-start" gap="4" width="full">
          <Text fontWeight="bold">{name}</Text>
          <Tabs.Root defaultValue="tab1" variant={variant} size={size}>
            <Tabs.List>
              <Tabs.Trigger value="tab1">First Tab</Tabs.Trigger>
              <Tabs.Trigger value="tab2">Second Tab</Tabs.Trigger>
              <Tabs.Trigger value="tab3">Third Tab</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="tab1">First tab content</Tabs.Content>
            <Tabs.Content value="tab2">Second tab content</Tabs.Content>
            <Tabs.Content value="tab3">Third tab content</Tabs.Content>
          </Tabs.Root>
        </VStack>
      )}
    </For>

    <Text fontSize="xl" fontWeight="bold" mt="8">
      Subtle Variant (Round/Pill)
    </Text>
    <For each={subtleVariants}>
      {({ name, variant, size, colorPalette }) => (
        <VStack alignItems="flex-start" gap="4" width="full">
          <Text fontWeight="bold">{name}</Text>
          <Tabs.Root defaultValue="tab1" variant={variant} size={size} colorPalette={colorPalette}>
            <Tabs.List>
              <Tabs.Trigger value="tab1">First Tab</Tabs.Trigger>
              <Tabs.Trigger value="tab2">Second Tab</Tabs.Trigger>
              <Tabs.Trigger value="tab3">Third Tab</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="tab1">First tab content</Tabs.Content>
            <Tabs.Content value="tab2">Second tab content</Tabs.Content>
            <Tabs.Content value="tab3">Third tab content</Tabs.Content>
          </Tabs.Root>
        </VStack>
      )}
    </For>
  </VStack>
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark" }
