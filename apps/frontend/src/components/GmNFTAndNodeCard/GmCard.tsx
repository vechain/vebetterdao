import { Text, VStack, HStack, Card, LinkBox, LinkOverlay, Icon, Image, Box, Center } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa"

const IMG_SIZE = "56px"
const OFFSET_X = 10
const OFFSET_Y = 4
const MAX_VISIBLE = 2

const ImageStack = ({ images }: { images: string[] }) => {
  const visible = images.slice(0, MAX_VISIBLE)
  const plusCount = images.length - MAX_VISIBLE
  const totalItems = visible.length + (plusCount > 0 ? 1 : 0)
  const containerW = 56 + (totalItems - 1) * OFFSET_X
  const containerH = 56 + (totalItems - 1) * OFFSET_Y

  return (
    <Box position="relative" isolation="isolate" w={`${containerW}px`} h={`${containerH}px`} flexShrink={0}>
      {visible.map((image, i) => (
        <Image
          key={image}
          src={image}
          alt=""
          w={IMG_SIZE}
          h={IMG_SIZE}
          objectFit="cover"
          rounded="lg"
          border="2px solid"
          borderColor="whiteAlpha.300"
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
          w={IMG_SIZE}
          h={IMG_SIZE}
          rounded="lg"
          bg="status.info.primary"
          border="2px solid"
          borderColor="whiteAlpha.300"
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
}: {
  title?: string
  subtitle?: string
  images?: string[]
  footer?: string
  href?: string
}) => {
  const { t } = useTranslation()
  const hasMultiple = images && images.length > 1

  return (
    <LinkBox flex={1}>
      <Card.Root bg="transparency.200" gap="2" p="4" border="0" h="full">
        <Card.Title asChild>
          <HStack w="full" justifyContent="space-between">
            <Text display="block" textStyle="sm" color="white" fontWeight="semibold">
              {subtitle}
            </Text>
            {hasMultiple && (
              <HStack gap={1} textStyle="sm" fontWeight="semibold">
                <Text color="white" fontWeight="semibold">
                  {t("See all")}
                </Text>
                <Icon as={FaChevronRight} color="white" boxSize="4" />
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
                    w={IMG_SIZE}
                    h={IMG_SIZE}
                    objectFit="cover"
                    rounded="lg"
                    flexShrink={0}
                  />
                ) : images && images.length > 1 ? (
                  <ImageStack images={images} />
                ) : null}

                <VStack flex="1" alignItems="start" gap="1">
                  {title && (
                    <Text textStyle="md" color="white" fontWeight="bold" lineClamp={1}>
                      {title}
                    </Text>
                  )}
                  <HStack bg="#FFFFFF4A" rounded="lg" px="2" py="1" gap="1">
                    <Text textStyle="xs" color="white" fontWeight="semibold" lineClamp={1}>
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
