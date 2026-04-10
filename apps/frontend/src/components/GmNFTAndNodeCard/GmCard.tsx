import { Text, VStack, HStack, Card, LinkBox, LinkOverlay, Icon, Image, Box, Center } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa"

const IMG_SIZE = "56px"
const OFFSET_X = 10
const OFFSET_Y = 4
const MAX_VISIBLE = 2

const sizeNum = (size: string) => (size.endsWith("px") ? parseInt(size, 10) : 56)
const ImageStack = ({
  images,
  imageSize = IMG_SIZE,
  imageRounded = "lg",
}: {
  images: string[]
  imageSize?: string
  imageRounded?: string
}) => {
  const visible = images.slice(0, MAX_VISIBLE)
  const plusCount = images.length - MAX_VISIBLE
  const totalItems = visible.length + (plusCount > 0 ? 1 : 0)
  const px = sizeNum(imageSize)
  const containerW = px + (totalItems - 1) * OFFSET_X
  const containerH = px + (totalItems - 1) * OFFSET_Y

  return (
    <Box position="relative" isolation="isolate" w={`${containerW}px`} h={`${containerH}px`} flexShrink={0}>
      {visible.map((image, i) => (
        <Image
          key={`${image}-${i}`}
          src={image}
          alt=""
          w={imageSize}
          h={imageSize}
          objectFit="cover"
          rounded={imageRounded}
          border="2px solid"
          borderColor="border.secondary"
          position="absolute"
          top={`${i * OFFSET_Y}px`}
          left={`${i * OFFSET_X}px`}
          zIndex={totalItems - i}
          shadow="md"
        />
      ))}
      {plusCount > 0 && (
        <Center
          position="absolute"
          top={`${visible.length * OFFSET_Y}px`}
          left={`${visible.length * OFFSET_X}px`}
          w={imageSize}
          h={imageSize}
          rounded={imageRounded}
          bg="status.info.primary"
          border="2px solid"
          borderColor="border.secondary"
          zIndex={0}
          shadow="md">
          <Text color="white" textStyle="xs" fontWeight="bold">{`+${plusCount}`}</Text>
        </Center>
      )}
    </Box>
  )
}

export const GmCard = ({
  title,
  subtitle,
  footer,
  images,
  href,
  imageSize = IMG_SIZE,
  imageRounded = "lg",
}: {
  title?: string
  subtitle?: string
  images?: string[]
  footer?: string
  href?: string
  imageSize?: string
  imageRounded?: string
}) => {
  const { t } = useTranslation()
  const hasMultiple = images && images.length > 1

  return (
    <LinkBox flex={1}>
      <Card.Root variant="subtle" gap="2" p="4" border="0" h="full">
        <Card.Title asChild>
          <HStack w="full" justifyContent="space-between">
            <Text display="block" textStyle="sm" color="text.default" fontWeight="semibold">
              {subtitle}
            </Text>
            {hasMultiple && (
              <HStack gap={1} textStyle="sm" fontWeight="semibold">
                <Text color="text.default" fontWeight="semibold">
                  {t("See all")}
                </Text>
                <Icon as={FaChevronRight} color="text.default" boxSize="4" />
              </HStack>
            )}
          </HStack>
        </Card.Title>
        <Card.Body>
          <LinkOverlay asChild>
            <NextLink href={href ?? ""}>
              <HStack alignItems="start">
                {images && images.length === 1 ? (
                  <Image
                    src={images[0]}
                    alt=""
                    w={imageSize}
                    h={imageSize}
                    minW={imageSize}
                    minH={imageSize}
                    objectFit="cover"
                    rounded={imageRounded}
                    flexShrink={0}
                  />
                ) : images && images.length > 1 ? (
                  <ImageStack images={images} imageSize={imageSize} imageRounded={imageRounded} />
                ) : null}

                <VStack flex="1" alignItems="start" gap="1">
                  {title && (
                    <Text textStyle="md" color="text.default" fontWeight="bold" lineClamp={1}>
                      {title}
                    </Text>
                  )}
                  <HStack bg={{ base: "gray.100", _dark: "transparency.300" }} rounded="lg" px="2" py="1" gap="1">
                    <Text textStyle="xs" color="text.default" fontWeight="semibold" lineClamp={1}>
                      {footer}
                    </Text>
                  </HStack>
                </VStack>
              </HStack>
            </NextLink>
          </LinkOverlay>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
