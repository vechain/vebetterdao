import { Button, VStack, Text, Box, For } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

const meta = {
  title: "b3tr/components/Banner",
  component: GenericBanner,
} satisfies Meta<typeof GenericBanner>

export default meta

export const LightMode = () => (
  <VStack gap="8" w="full">
    <For
      each={[
        { variant: "info" as const, color: "Blue" },
        { variant: "success" as const, color: "Green" },
      ]}>
      {({ variant, color }) => (
        <Box w="full">
          <Text textStyle="xl" fontWeight="bold" mb="2">
            {color} Variant
          </Text>
          <GenericBanner
            variant={variant}
            title="Lorem ipsum"
            description="Lorem ipsum dolor sit amet, consectetur adipiscing elit"
            cta={<Button variant="primary">Button</Button>}
            onClose={() => alert(`Closed ${color}`)}
          />
        </Box>
      )}
    </For>
  </VStack>
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark", viewport: { value: "responsive" } }

export const MobileLightMode = () => cloneElement(<LightMode />)
MobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const MobileDarkMode = () => cloneElement(<LightMode />)
MobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }
