import { Button, VStack } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

const meta = {
  title: "design-system/components/Banner",
  component: GenericBanner,
} satisfies Meta<typeof GenericBanner>

export default meta

export const LightMode = () => (
  <VStack gap="4">
    <GenericBanner
      logoSrc="/assets/icons/info-bell.webp"
      variant="info"
      title="Primary"
      description="Info"
      cta={<Button variant="primary">{"CTA"}</Button>}
    />
    <GenericBanner
      logoSrc="/assets/icons/info-bell.webp"
      variant="success"
      title="Success"
      description="Success"
      cta={<Button variant="primary">{"CTA"}</Button>}
    />
    <GenericBanner
      logoSrc="/assets/icons/info-bell.webp"
      variant="warning"
      title="Warning"
      description="Warning"
      cta={<Button variant="primary">{"CTA"}</Button>}
    />
  </VStack>
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark" }
