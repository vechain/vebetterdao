import { Heading, Text, VStack, Card, HStack, Image, Button, useMediaQuery, Box } from "@chakra-ui/react"
import React from "react"

type GenericBannerProps = {
  title: string
  titleColor?: string
  description: string | React.ReactElement
  descriptionColor?: string
  logoSrc?: string | React.ReactElement
  backgroundColor?: string
  backgroundImageSrc?: string
  buttonLabel?: string
  onButtonClick?: () => void
  buttonVariant?: "outline" | "primaryAction" | "custom"
  buttonIcon?: React.ReactElement
  buttonIconPosition?: "left" | "right"
  customButton?: React.ReactElement
  imagePosition?: "top" | "center"
}

export const GenericBanner: React.FC<GenericBannerProps> = ({
  title,
  titleColor = "#8D6602",
  description,
  descriptionColor = "#5F4400",
  logoSrc,
  backgroundColor = "#FFD979",
  backgroundImageSrc,
  buttonLabel,
  onButtonClick,
  buttonVariant = "outline",
  buttonIcon,
  buttonIconPosition = "right",
  customButton,
  imagePosition = "center",
}) => {
  const [isVerySmallMobile] = useMediaQuery(["(max-height: 667px)"])
  const isOutlineBtn = buttonVariant === "outline"
  const isIconLeft = buttonIconPosition === "left"
  const hasButton = buttonLabel ?? buttonIcon ?? customButton

  const descriptionElement =
    typeof description === "string" ? (
      <Heading fontSize="lg" fontWeight="700" color={descriptionColor}>
        {description}
      </Heading>
    ) : (
      description
    )

  const renderButton = () => {
    if (customButton) return customButton

    return (
      <Button
        onClick={onButtonClick}
        borderRadius="full"
        variant={buttonVariant === "outline" ? "outline" : "primaryAction"}
        {...(isOutlineBtn && {
          bg: "transparent",
          border: "1px solid #5F4400",
          _hover: { bg: "#5F440020" },
        })}>
        {isIconLeft && buttonIcon}
        <Text fontWeight="500">{buttonLabel}</Text>
        {!isIconLeft && buttonIcon}
      </Button>
    )
  }

  return (
    <Card.Root
      bg={backgroundColor}
      borderRadius="xl"
      w="full"
      h="full"
      minH={{
        base: "30vh",
        sm: "30vh",
        md: "auto",
      }}
      position="relative"
      overflow="hidden">
      {/* Background Layer */}
      {backgroundImageSrc && (
        <Box
          position="absolute"
          inset={0}
          zIndex={0}
          bgImage={backgroundImageSrc ? `url(${backgroundImageSrc})` : undefined}
          bgSize="cover"
          backgroundPosition={imagePosition}
          bgRepeat="no-repeat"
          _before={{
            content: '""',
            position: "absolute",
            inset: 0,
            bg: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%)",
            pointerEvents: "none",
          }}
        />
      )}
      <Card.Body
        position="relative"
        zIndex={1}
        alignContent="center"
        justifyContent="center"
        borderRadius="xl"
        padding={{ base: 4, md: 6 }}>
        <HStack hideBelow="md" align="stretch" position="relative" w="full">
          {logoSrc &&
            (typeof logoSrc === "string" ? (
              <Image src={logoSrc} alt="logo" objectFit="cover" w={24} h={24} />
            ) : (
              logoSrc
            ))}
          <HStack flex={1}>
            <VStack gap={2} align="stretch" flex={1}>
              <Text textStyle="xs" color={titleColor} fontWeight="600">
                {title}
              </Text>
              {descriptionElement}
            </VStack>
            {hasButton && renderButton()}
          </HStack>
        </HStack>

        <HStack hideFrom="md" align="center" position="relative" w="full" alignItems="center">
          <VStack gap={2} align="stretch" justify="space-between">
            <Text fontSize={12} color={titleColor} fontWeight="600">
              {title}
            </Text>
            <Heading fontSize="18" fontWeight="700" color={descriptionColor}>
              {description}
            </Heading>
            {hasButton && renderButton()}
          </VStack>
          {logoSrc &&
            (typeof logoSrc === "string" ? (
              <Image src={logoSrc} alt="logo" w={isVerySmallMobile ? 16 : 24} h={isVerySmallMobile ? 16 : 24} />
            ) : (
              React.cloneElement(logoSrc, {
                w: isVerySmallMobile ? 16 : 24,
                h: isVerySmallMobile ? 16 : 24,
              })
            ))}
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}
