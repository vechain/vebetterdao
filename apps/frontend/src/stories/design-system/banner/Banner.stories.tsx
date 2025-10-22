import { Button, VStack, Text, Box, For } from "@chakra-ui/react"
import { Meta } from "@storybook/nextjs-vite"
import { cloneElement } from "react"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

const meta = {
  title: "design-system/components/Banner",
  component: GenericBanner,
} satisfies Meta<typeof GenericBanner>

export default meta

export const LightMode = () => (
  <VStack gap="8" w="full">
    <For
      each={[
        { variant: "default" as const, color: "Blue" },
        { variant: "b3mo" as const, color: "Green" },
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

export const ActionBannersLightMode = () => (
  <VStack gap="8" w="full">
    <For
      each={
        [
          {
            variant: "default",
            title: "Not enough VTHO",
            description: "Get more VTHO to be able to vote and perform transaction!",
            buttonText: "Get VTHO",
            buttonVariant: "primary",
          },
          {
            variant: "default",
            title: "Voting power delegated",
            description: (
              <>
                Your voting power is currently delegated to{" "}
                <Text as="span" textDecoration="underline">
                  veDelegate.vet
                </Text>
                . To vote directly here, please remove the delegation before the snapshot.
              </>
            ),
            buttonText: "Learn more",
            buttonVariant: "secondary",
          },
          {
            variant: "default",
            title: "Time to step up!",
            description: "Complete Better Actions in our apps and unlock your right to vote. Make your impact count!",
            buttonText: "Learn more",
            buttonVariant: "ghost",
          },
          {
            variant: "default",
            title: "Cast your vote now!",
            description: "It's time to make your voice heard in this round and earn extra exiting rewards!",
            buttonText: "See round",
            buttonVariant: "primary",
          },
        ] as const
      }>
      {({ variant, title, description, buttonText, buttonVariant }) => (
        <Box w="full">
          <GenericBanner
            variant={variant}
            title={title}
            description={description}
            cta={<Button variant={buttonVariant as any}>{buttonText}</Button>}
            onClose={() => alert(`Closed ${title}`)}
          />
        </Box>
      )}
    </For>
  </VStack>
)

export const ActionBannersDarkMode = () => cloneElement(<ActionBannersLightMode />)
ActionBannersDarkMode.globals = { theme: "dark", viewport: { value: "responsive" } }

export const ActionBannersMobileLightMode = () => cloneElement(<ActionBannersLightMode />)
ActionBannersMobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const ActionBannersMobileDarkMode = () => cloneElement(<ActionBannersLightMode />)
ActionBannersMobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }

export const CreatorBannersLightMode = () => (
  <VStack gap="8" w="full">
    <For
      each={
        [
          {
            variant: "default",
            title: "Creators NFT received",
            description: "Your Creator application was approved. Submit your app!",
            buttonText: "Submit app",
            buttonVariant: "primary",
          },
          {
            variant: "default",
            title: "Creators Application rejected",
            description: "Your Creator' NFT application was rejected",
            buttonText: "Apply again",
            buttonVariant: "primary",
          },
          {
            variant: "default",
            title: "Creators Application under review",
            description: "Your Creator' application is being reviewed",
            buttonText: "Check status",
            buttonVariant: "ghost",
          },
        ] as const
      }>
      {({ variant, title, description, buttonText, buttonVariant }) => (
        <Box w="full">
          <GenericBanner
            variant={variant}
            title={title}
            description={description}
            cta={<Button variant={buttonVariant as any}>{buttonText}</Button>}
            onClose={() => alert(`Closed ${title}`)}
          />
        </Box>
      )}
    </For>
  </VStack>
)

export const CreatorBannersDarkMode = () => cloneElement(<CreatorBannersLightMode />)
CreatorBannersDarkMode.globals = { theme: "dark", viewport: { value: "responsive" } }

export const CreatorBannersMobileLightMode = () => cloneElement(<CreatorBannersLightMode />)
CreatorBannersMobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const CreatorBannersMobileDarkMode = () => cloneElement(<CreatorBannersLightMode />)
CreatorBannersMobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }

export const AnnouncementBannersLightMode = () => (
  <VStack gap="8" w="full">
    <For
      each={
        [
          {
            variant: "default",
            title: "Active proposal",
            description: "Sample proposal title for testing",
            buttonText: "View proposal",
            buttonVariant: "primary",
          },
          {
            variant: "default",
            title: "New App available",
            description: "Sample App just joined the DAO! Get involved in the app now!",
            buttonText: "Explore",
            buttonVariant: "primary",
          },
          {
            variant: "default",
            title: "You have been signalled",
            description: (
              <>
                You have been signalled by{" "}
                <Text as="span" fontWeight="semibold">
                  Mugshot
                </Text>
                . If you believe this signal is unfair, please reach out to the app that signalled you to resolve the
                issue.
              </>
            ),
            buttonText: "Appeal",
            buttonVariant: "ghost",
          },
        ] as const
      }>
      {({ variant, title, description, buttonText, buttonVariant }) => (
        <Box w="full">
          <GenericBanner
            variant={variant}
            title={title}
            description={description}
            cta={<Button variant={buttonVariant as any}>{buttonText}</Button>}
            onClose={() => alert(`Closed ${title}`)}
          />
        </Box>
      )}
    </For>
  </VStack>
)

export const AnnouncementBannersDarkMode = () => cloneElement(<AnnouncementBannersLightMode />)
AnnouncementBannersDarkMode.globals = { theme: "dark", viewport: { value: "responsive" } }

export const AnnouncementBannersMobileLightMode = () => cloneElement(<AnnouncementBannersLightMode />)
AnnouncementBannersMobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const AnnouncementBannersMobileDarkMode = () => cloneElement(<AnnouncementBannersLightMode />)
AnnouncementBannersMobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }

export const StargateAnnouncementsLightMode = () => (
  <VStack gap="8" w="full">
    <For
      each={
        [
          {
            variant: "b3mo",
            title: "Stargate is live",
            description: "Start staking VET to explore the new Stargate universe!",
            buttonText: "Explore",
          },
          {
            variant: "b3mo",
            title: "Stargate is live",
            description: "Migrate your legacy node to discover the new Stargate universe",
            buttonText: "Explore",
          },
        ] as const
      }>
      {({ variant, title, description, buttonText }) => (
        <Box w="full">
          <GenericBanner
            variant={variant}
            title={title}
            description={description}
            cta={<Button variant="primary">{buttonText}</Button>}
            onClose={() => alert(`Closed ${title}`)}
          />
        </Box>
      )}
    </For>
  </VStack>
)

export const StargateAnnouncementsDarkMode = () => cloneElement(<StargateAnnouncementsLightMode />)
StargateAnnouncementsDarkMode.globals = { theme: "dark", viewport: { value: "responsive" } }

export const StargateAnnouncementsMobileLightMode = () => cloneElement(<StargateAnnouncementsLightMode />)
StargateAnnouncementsMobileLightMode.globals = { theme: "light", viewport: { value: "mobile2" } }

export const StargateAnnouncementsMobileDarkMode = () => cloneElement(<StargateAnnouncementsLightMode />)
StargateAnnouncementsMobileDarkMode.globals = { theme: "dark", viewport: { value: "mobile2" } }
