import { Card, Image, Heading, Text, Box, CloseButton, Flex, CardRootProps } from "@chakra-ui/react"
import { ReactNode } from "react"

type BannerVariant = "default" | "b3mo"
type BannerSize = "S" | "M" | "L"

interface BannerConfig {
  bg: string
  illustration: string
  bgImage: string
}

const variantConfig: Record<BannerVariant, BannerConfig> = {
  default: {
    bg: "banner.blue",
    illustration: "/assets/images/grants/step-1.webp",
    bgImage: "/assets/backgrounds/clouds-blue.webp",
  },
  b3mo: {
    bg: "banner.green",
    illustration: "/assets/mascot/mascot-welcoming.webp",
    bgImage: "/assets/backgrounds/clouds-blue.webp",
  },
}

const bgPositioning = {
  top: { base: "-86.5%", lg: "50%" },
  right: { base: "-63.4%", lg: "-14.5%" },
  w: { base: "127%", lg: "56%" },
  h: { base: "273%", lg: "380%" },
  transform: { base: "none", lg: "translateY(-50%)" },
}

const paddings: Record<BannerSize, CardRootProps["p"]> = {
  S: "4", // 16px
  M: "6", // 24px
  L: "10", // 40px
}

const titleSizes = {
  S: "md",
  M: "xl",
  L: "2xl",
}

const descSizes = {
  S: "sm",
  M: "sm",
  L: "md",
}

const gaps = {
  S: "2",
  M: "6",
  L: "6",
}

type B3MOIllustration =
  | "/assets/mascot/mascot-explore-dapps@1x.webp"
  | "/assets/mascot/mascot-explore-dapps@2x.webp"
  | "/assets/mascot/mascot-warning-head.webp"
  | "/assets/mascot/mascot-holding-tokens.webp"
  | "/assets/mascot/mascot-welcoming-left-head.webp"
  | "/assets/mascot/mascot-welcoming.webp"
  | "/assets/images/b3mo-stargate-greet.webp"

export const GenericBanner = ({
  variant = "default",
  title,
  description,
  cta,
  size = "M",
  onClose,
  illustration,
}: {
  title: string
  description: ReactNode
  cta?: ReactNode
  size?: BannerSize
  onClose?: () => void
} & ({ variant?: "default"; illustration?: string } | { variant: "b3mo"; illustration?: B3MOIllustration })) => {
  const config = variantConfig[variant]
  return (
    <Card.Root
      flex={1}
      w="full"
      h="full"
      borderRadius="xl"
      overflow="hidden"
      bg={config.bg}
      border="sm"
      borderColor="border.secondary"
      position="relative"
      p={paddings[size]}>
      <Box position="absolute" {...bgPositioning} display="flex" alignItems="center" justifyContent="center">
        <Box w="full" h="full" display="flex" alignItems="center" justifyContent="center" position="relative">
          <Image
            src="/assets/backgrounds/cloud-blue.webp"
            alt=""
            w="full"
            h="auto"
            aspectRatio={{ base: "1.068", lg: "1.079" }}
            objectFit="cover"
            objectPosition="center"
            opacity={{ base: 1, _dark: 0.2 }}
          />
        </Box>
      </Box>

      <Flex
        position="absolute"
        right={{ base: "20px", md: "40px" }}
        top="50%"
        transform="translateY(-50%)"
        w="140px"
        h="140px"
        zIndex={1}>
        <Image src={illustration || config.illustration} alt="" w="full" h="full" objectFit="contain" />
      </Flex>

      {onClose && (
        <CloseButton
          onClick={onClose}
          position="absolute"
          top="4"
          right="4"
          size="2xs"
          bgColor="white"
          color="black"
          zIndex={2}
          _hover={{ opacity: 0.8 }}
          transition="all 0.2s"
        />
      )}

      <Flex position="relative" zIndex={1} flex={1} flexDirection="column" gap={gaps[size]} maxW="60%">
        <Box display="flex" flexDirection="column" gap="2">
          <Heading size={titleSizes[size] as any} fontWeight="bold" color="text.default">
            {title}
          </Heading>
          {typeof description === "string" ? (
            <Text textStyle={descSizes[size]} color="text.subtle">
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
