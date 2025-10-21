import { Card, Image, Heading, Text, Box, CloseButton, Flex, CardRootProps } from "@chakra-ui/react"
import { ReactNode } from "react"

type BannerVariant = "info" | "success"
type BannerSize = "S" | "M" | "L"

interface BannerConfig {
  bg: string
  illustration: string
  bgImage: string
}

const variantConfig: Record<BannerVariant, BannerConfig> = {
  info: {
    bg: "banner.blue",
    illustration: "/assets/images/grants/step-1.webp",
    bgImage: "/assets/backgrounds/blue-cloud-full.webp",
  },
  success: {
    bg: "banner.green",
    illustration: "/assets/mascot/mascot-welcoming.webp",
    bgImage: "/assets/backgrounds/community-green-blob.webp",
  },
}

export const GenericBanner = ({
  variant,
  title,
  description,
  cta,
  size = "M",
  onClose,
  illustration,
}: {
  variant: BannerVariant
  title: string
  description: ReactNode
  cta?: ReactNode
  size?: BannerSize
  onClose?: () => void
  illustration?: string
}) => {
  const config = variantConfig[variant]

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
      <Box
        position="absolute"
        top="0"
        bottom="0"
        right="0"
        // inset={"-14.19% -25.62% -18.8% -27.72%"}
        display="flex"
        alignItems="center"
        justifyContent="center">
        <Box w={"405.505px"} h={"426.178px"} transform={"rotate(150deg)"}>
          <Image src={config.bgImage} alt="" w="full" h="full" objectFit="cover" opacity={{ base: 0.8, _dark: 0.4 }} />
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
