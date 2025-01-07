import { Heading, Text, VStack, Card, CardBody, HStack, Image, Button, Show, useMediaQuery } from "@chakra-ui/react"

type GenericBannerProps = {
  title: string
  titleColor?: string
  description: string
  descriptionColor?: string
  logoSrc?: string
  backgroundColor?: string
  backgroundImageSrc?: string
  buttonLabel?: string
  onButtonClick?: () => void
  buttonVariant?: "outline" | "primaryAction"
  buttonIcon?: React.ReactElement
  buttonIconPosition?: "left" | "right"
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
}) => {
  const [isVerySmallMobile] = useMediaQuery("(max-height: 667px)")
  const isOutlineBtn = buttonVariant === "outline"
  const isIconLeft = buttonIconPosition === "left"
  const hasButton = buttonLabel ?? buttonIcon

  return (
    <Card bg={backgroundColor} borderRadius="xl" w="full" h="auto">
      <CardBody
        position="relative"
        overflow="hidden"
        alignContent="center"
        justifyContent="center"
        borderRadius="xl"
        padding={{ base: 4, md: 6 }}>
        {backgroundImageSrc && (
          <Image
            src={backgroundImageSrc}
            alt="background"
            position="absolute"
            right={["-50%", "-50%", "-10%"]}
            top={["-50%", "-50%", "-150%"]}
          />
        )}
        <Show breakpoint="(min-width: 768px)">
          <HStack align="stretch" zIndex={1} position="relative" w="full">
            {logoSrc && <Image src={logoSrc} alt="logo" w={24} h={24} />}
            <HStack flex={1}>
              <VStack gap={2} align="stretch" flex={1}>
                <Text size="xs" color={titleColor} fontWeight="600">
                  {title}
                </Text>
                <Heading fontSize="lg" fontWeight="700" color={descriptionColor}>
                  {description}
                </Heading>
              </VStack>
              {hasButton && (
                <Button
                  onClick={onButtonClick}
                  borderRadius="full"
                  variant={buttonVariant === "outline" ? "outline" : "primaryAction"}
                  {...(isOutlineBtn && {
                    bg: "transparent",
                    border: "1px solid #5F4400",
                    _hover: { bg: "#5F440020" },
                  })}
                  {...(isIconLeft ? { leftIcon: buttonIcon } : { rightIcon: buttonIcon })}>
                  <Text fontWeight="500">{buttonLabel}</Text>
                </Button>
              )}
            </HStack>
          </HStack>
        </Show>
        <Show breakpoint="(max-width: 767px)">
          <HStack align="center" zIndex={1} position="relative" w="full" alignItems="center">
            <VStack gap={2} align="stretch" justify="space-between">
              <Text fontSize={12} color={titleColor} fontWeight="600">
                {title}
              </Text>
              <Heading fontSize="18" fontWeight="700" color={descriptionColor}>
                {description}
              </Heading>
              {hasButton && (
                <Button
                  onClick={onButtonClick}
                  borderRadius="full"
                  variant={buttonVariant === "outline" ? "outline" : "primaryAction"}
                  {...(isOutlineBtn && {
                    bg: "transparent",
                    border: "1px solid #5F4400",
                    _hover: { bg: "#5F440020" },
                  })}
                  {...(isIconLeft ? { leftIcon: buttonIcon } : { rightIcon: buttonIcon })}>
                  <Text fontWeight="500">{buttonLabel}</Text>
                </Button>
              )}
            </VStack>
            {logoSrc && (
              <Image src={logoSrc} alt="logo" w={isVerySmallMobile ? 16 : 24} h={isVerySmallMobile ? 16 : 24} />
            )}
          </HStack>
        </Show>
      </CardBody>
    </Card>
  )
}
