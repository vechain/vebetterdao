import { Card, Image, Heading, Text, Box, CloseButton, Flex, BoxProps, Float } from "@chakra-ui/react"
import { ReactNode } from "react"

import { useColorModeValue } from "@/components/ui/color-mode"

// TODO: will be used when closing banners enabled
export enum BannerStorageKey {
  STARGATE_MIGRATION = "show_stargate_banner",
  CAST_VOTE = "show_banner_cast_vote",
  CLAIM_REWARDS = "show_banner_claim_rewards",
  NEW_APP = "show_banner_new_app",
  CREATOR_NFT = "show_banner_creator_nft",
  LOW_VTHO = "show_banner_low_vtho",
  USER_SIGNALED = "show_banner_user_signaled",
  DELEGATING = "show_banner_delegating",
  DO_ACTION = "show_banner_do_action",
}

export const isBannerEnabled = (storageKey: string): boolean => {
  return localStorage.getItem(storageKey) === "true"
}

export const isBannerClosed = (storageKey: string): boolean => {
  return localStorage.getItem(storageKey) !== "true"
}

export const setBannerEnabled = (storageKey: string): void => {
  localStorage.setItem(storageKey, "true")
}

export const setBannerClosed = (storageKey: string): void => {
  localStorage.setItem(storageKey, "false")
}

type BannerVariant = "default" | "b3mo"

interface BannerConfig {
  bg: string
  illustration: string
  bgImageLight: string
  bgImageDark: string
}

const variantConfig: Record<BannerVariant, BannerConfig> = {
  default: {
    bg: "banner.blue",
    illustration: "/assets/images/grants/step-1.webp",
    bgImageLight: "/assets/backgrounds/banner-bg-blue-light.webp",
    bgImageDark: "/assets/backgrounds/banner-bg-blue-dark.webp",
  },
  b3mo: {
    bg: "banner.green",
    illustration: "/assets/mascot/mascot-welcoming-left-head.webp",
    bgImageLight: "/assets/backgrounds/banner-bg-green-light.webp",
    bgImageDark: "/assets/backgrounds/banner-bg-green-dark.webp",
  },
}

type B3MOIllustration =
  | "/assets/mascot/mascot-explore-dapps@1x.webp"
  | "/assets/mascot/mascot-explore-dapps@2x.webp"
  | "/assets/mascot/mascot-warning-head.webp"
  | "/assets/mascot/mascot-holding-tokens.webp"
  | "/assets/mascot/mascot-welcoming-left-head.webp"
  | "/assets/images/b3mo-stargate-greet.webp"

type GenericBannerProps = {
  title: string
  description: ReactNode
  cta?: ReactNode
  closable?: boolean
  storageKey?: string
  onClose?: () => void
  illustrationDimensions?: {
    width?: BoxProps["width"]
    height?: BoxProps["height"]
  }
} & ({ variant?: "default"; illustration?: string } | { variant: "b3mo"; illustration?: B3MOIllustration })

export const GenericBanner = ({
  variant = "default",
  title,
  description,
  cta,
  closable = false,
  storageKey,
  onClose,
  illustration,
  illustrationDimensions,
}: GenericBannerProps) => {
  const config = variantConfig[variant]
  const bgImage = useColorModeValue(config.bgImageLight, config.bgImageDark)

  const handleClose = () => {
    if (storageKey) setBannerClosed(storageKey)

    onClose?.()
  }

  return (
    <Card.Root
      flex={1}
      w="full"
      h="full"
      minH="40"
      borderRadius="xl"
      overflow="hidden"
      bg={config.bg}
      border="sm"
      borderColor="border.secondary"
      position="relative"
      px={{ base: 4, lg: 10 }}
      py={{ base: 4, lg: 6 }}>
      <Float right={{ base: "20px", md: "175px" }} placement="middle-end" height="full" w="full">
        <Image src={bgImage} alt="bg-image-banner" h="full" w="auto" />
      </Float>

      <Flex
        position="absolute"
        right={{ base: "4", md: "16" }}
        top="50%"
        transform="translateY(-50%)"
        w={illustrationDimensions?.width || (variant === "b3mo" ? "150px" : "128px")}
        h={illustrationDimensions?.height || (variant === "b3mo" ? "150px" : "128px")}
        zIndex={1}>
        <Image src={illustration || config.illustration} alt="" w="full" h="full" objectFit="contain" />
      </Flex>

      {closable && (
        <CloseButton
          variant="secondary"
          onClick={handleClose}
          position="absolute"
          top="4"
          right="4"
          size="2xs"
          zIndex={2}
          bgColor="actions.secondary.default"
          css={{
            "& svg": { color: "actions.secondary.text" },
          }}
        />
      )}

      <Flex
        position="relative"
        zIndex={1}
        flex={1}
        flexDirection="column"
        gap={{ base: 2, md: 6 }}
        justifyContent="space-between">
        <Box display="flex" flexDirection="column" gap="2" maxW={{ base: "60%", lg: "80%" }}>
          <Heading size={{ base: "md", md: "xl", lg: "2xl" }} fontWeight="bold" color="text.default">
            {title}
          </Heading>
          {typeof description === "string" ? (
            <Text textStyle={{ base: "sm", lg: "md" }} color="text.subtle">
              {description}
            </Text>
          ) : (
            description
          )}
        </Box>
        {cta && <Box>{cta}</Box>}
      </Flex>
    </Card.Root>
  )
}
