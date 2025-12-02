import { VStack, Button } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

import { CastVoteBanner } from "@/app/components/ActionBanners/components/CastVoteBanner"
import { CreatorApplicationApprovedBanner } from "@/app/components/ActionBanners/components/CreatorNFTBanner/CreatorApplicationApprovedBanner"
import { CreatorApplicationRejectedBanner } from "@/app/components/ActionBanners/components/CreatorNFTBanner/CreatorApplicationRejectedBanner"
import { CreatorApplicationUnderReviewBanner } from "@/app/components/ActionBanners/components/CreatorNFTBanner/CreatorApplicationUnderReviewBanner"
import { DelegatingBanner } from "@/app/components/ActionBanners/components/DelegatingBanner"
import { DoActionBanner } from "@/app/components/ActionBanners/components/DoActionBanner/DoActionBanner"
import { LowVthoBanner } from "@/app/components/ActionBanners/components/LowVthoBanner/LowVthoBanner"
import { NewAppBanner } from "@/app/components/ActionBanners/components/NewAppBanner/NewAppBanner"
import { StargateMigrationBanner } from "@/app/components/ActionBanners/components/StargateMigrationBanner/StargateMigrationBanner"
import { UserSignaledBanner } from "@/app/components/ActionBanners/components/UserSignaledBanner/UserSignaledBanner"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"

const meta = {
  title: "design-system/components/Banner",
  component: GenericBanner,
} satisfies Meta<typeof GenericBanner>

export default meta

export const LightMode = () => (
  <VStack gap="8" w="full">
    <GenericBanner
      variant="default"
      title="Lorem ipsum"
      description="Lorem ipsum dolor sit amet, consectetur adipiscing elit"
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="primary">
          Button
        </Button>
      }
      onClose={() => alert("Closed")}
    />
    <GenericBanner
      variant="b3mo"
      title="Lorem ipsum"
      description="Lorem ipsum dolor sit amet, consectetur adipiscing elit"
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="primary">
          Button
        </Button>
      }
      onClose={() => alert("Closed")}
    />
  </VStack>
)

export const DarkMode = () => cloneElement(<LightMode />)
DarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const MobileLightMode = () => cloneElement(<LightMode />)
MobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const MobileDarkMode = () => cloneElement(<LightMode />)
MobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }

export const ActionBannersLightMode = () => (
  <VStack gap="8" w="full">
    <LowVthoBanner />
    <DelegatingBanner />
    <DoActionBanner />
    <CastVoteBanner />
  </VStack>
)

export const ActionBannersDarkMode = () => cloneElement(<ActionBannersLightMode />)
ActionBannersDarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const ActionBannersMobileLightMode = () => cloneElement(<ActionBannersLightMode />)
ActionBannersMobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const ActionBannersMobileDarkMode = () => cloneElement(<ActionBannersLightMode />)
ActionBannersMobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }

export const CreatorBannersLightMode = () => (
  <VStack gap="8" w="full">
    <CreatorApplicationApprovedBanner />
    <CreatorApplicationRejectedBanner />
    <CreatorApplicationUnderReviewBanner />
  </VStack>
)

export const CreatorBannersDarkMode = () => cloneElement(<CreatorBannersLightMode />)
CreatorBannersDarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const CreatorBannersMobileLightMode = () => cloneElement(<CreatorBannersLightMode />)
CreatorBannersMobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const CreatorBannersMobileDarkMode = () => cloneElement(<CreatorBannersLightMode />)
CreatorBannersMobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }

export const AnnouncementBannersLightMode = () => (
  <VStack gap="8" w="full">
    <NewAppBanner />
    <UserSignaledBanner />
  </VStack>
)

export const AnnouncementBannersDarkMode = () => cloneElement(<AnnouncementBannersLightMode />)
AnnouncementBannersDarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const AnnouncementBannersMobileLightMode = () => cloneElement(<AnnouncementBannersLightMode />)
AnnouncementBannersMobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const AnnouncementBannersMobileDarkMode = () => cloneElement(<AnnouncementBannersLightMode />)
AnnouncementBannersMobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }

export const StargateAnnouncementsLightMode = () => (
  <VStack gap="8" w="full">
    <StargateMigrationBanner />
  </VStack>
)

export const StargateAnnouncementsDarkMode = () => cloneElement(<StargateAnnouncementsLightMode />)
StargateAnnouncementsDarkMode.globals = { theme: "dark", viewport: { value: "desktop" } }

export const StargateAnnouncementsMobileLightMode = () => cloneElement(<StargateAnnouncementsLightMode />)
StargateAnnouncementsMobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const StargateAnnouncementsMobileDarkMode = () => cloneElement(<StargateAnnouncementsLightMode />)
StargateAnnouncementsMobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }
