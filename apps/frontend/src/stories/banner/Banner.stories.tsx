import type { Meta } from "@storybook/nextjs-vite"
import { GenericBanner2 } from "@/app/components/Banners/GenericBanner2"
import { Button, VStack } from "@chakra-ui/react"

const meta = {
  title: "b3tr/components/Banner",
  component: GenericBanner2,
} satisfies Meta<typeof GenericBanner2>

export default meta

export const Default = () => (
  <VStack gap="4">
    <GenericBanner2
      logoSrc="/assets/icons/info-bell.webp"
      variant="info"
      title="Primary"
      description="Info"
      cta={<Button variant="primary">CTA</Button>}
    />
    <GenericBanner2
      logoSrc="/assets/icons/info-bell.webp"
      variant="success"
      title="Success"
      description="Success"
      cta={<Button variant="primary">CTA</Button>}
    />
    <GenericBanner2
      logoSrc="/assets/icons/info-bell.webp"
      variant="warning"
      title="Warning"
      description="Warning"
      cta={<Button variant="primary">CTA</Button>}
    />
  </VStack>
)
