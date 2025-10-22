import { Badge, ColorSwatch, For, Group, HStack, Stack, Text, VStack } from "@chakra-ui/react"
import type { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

import theme from "../../../app/theme/theme"

const meta = {
  title: "design-system/components/Colors",
  parameters: { layout: "padded" },
} satisfies Meta

export default meta

const themeColors = theme._config.theme?.tokens?.colors || {}

const buildColorScale = (scaleName: string, colors: Record<string, any>) => {
  return Object.entries(colors)
    .filter(([key]) => key !== "DEFAULT" && typeof colors[key] === "object" && colors[key].value)
    .map(([key, token]) => ({
      name: `${scaleName}.${key}`,
      value: typeof token.value === "string" ? token.value : token.value.base || token.value._light,
    }))
    .filter(color => color.value && typeof color.value === "string" && color.value.startsWith("#"))
}

const colorScales = Object.entries(themeColors).reduce(
  (acc, [scaleName, scaleColors]) => {
    if (typeof scaleColors === "object" && scaleColors !== null) {
      const colors = buildColorScale(scaleName, scaleColors as Record<string, any>)
      if (colors.length > 0) {
        acc[scaleName] = colors
      }
    }
    return acc
  },
  {} as Record<string, Array<{ name: string; value: string }>>,
)

export const LightMode = () => (
  <VStack align="stretch" gap={8}>
    <For each={Object.entries(colorScales)}>
      {([scaleName, colors]) => (
        <Stack key={scaleName} gap={4}>
          <Text fontSize="xl" fontWeight="semibold" textTransform="capitalize">
            {scaleName.replace("-", " ")} Scale
          </Text>
          <Group attached width="full" maxW="2xl" grow>
            <For each={colors}>{color => <ColorSwatch key={color.name} value={color.value} size="2xl" />}</For>
          </Group>
          <HStack wrap="wrap" gap={3}>
            <For each={colors}>
              {color => (
                <Badge key={color.name} px={3} py={2} borderRadius="md">
                  <HStack gap={2}>
                    <ColorSwatch value={color.value} boxSize="1em" />
                    <VStack align="start" gap={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {color.name}
                      </Text>
                      <Text fontSize="xs" color="text.default">
                        {color.value}
                      </Text>
                    </VStack>
                  </HStack>
                </Badge>
              )}
            </For>
          </HStack>
        </Stack>
      )}
    </For>
  </VStack>
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark" }
