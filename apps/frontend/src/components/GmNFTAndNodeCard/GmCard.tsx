import { Avatar, Text, VStack, HStack, AvatarGroup, Card, LinkBox, LinkOverlay } from "@chakra-ui/react"
import { FaChevronRight } from "react-icons/fa"
import { useTranslation } from "react-i18next"

export const GmCard = ({
  title,
  subtitle,
  footer,
  images,
  onCardClick,
}: {
  title?: string
  subtitle?: string
  images?: string[]
  footer?: string
  onCardClick?: () => void
}) => {
  const { t } = useTranslation()

  const plusCount = images?.length ? images?.length - 2 : 0

  return (
    <LinkBox flex={1}>
      <Card.Root bg="transparency.200" gap="2" p="4">
        <Card.Title asChild>
          <HStack w="full" justifyContent="space-between">
            <Text display="block" textStyle="sm" color="white" fontWeight="semibold">
              {subtitle}
            </Text>
            {images && images?.length > 1 && (
              <HStack gap={1} textStyle="md" fontWeight="semibold">
                <Text color="white" fontWeight="semibold">
                  {t("See all")}
                </Text>
                <FaChevronRight color="icon.default" size="14px" />
              </HStack>
            )}
          </HStack>
        </Card.Title>
        <Card.Body>
          <LinkOverlay href="#">
            <HStack alignItems="start">
              <AvatarGroup rounded="lg" shape="square" size="xl" stacking="last-on-top" spaceX={"-1.5rem"}>
                {images?.slice(0, 2)?.map(image => (
                  <Avatar.Root key={image} border="0" rounded="lg">
                    <Avatar.Image rounded="lg" src={image} />
                  </Avatar.Root>
                ))}

                {plusCount > 0 && (
                  <Avatar.Root rounded="lg" border="1px solid #E5EEFF" background="#6194F5">
                    <Avatar.Fallback fontSize="12px">{`+${plusCount}`}</Avatar.Fallback>
                  </Avatar.Root>
                )}
              </AvatarGroup>

              <VStack flex="1" flexDirection={"column-reverse"} alignItems="start" alignSelf="end" gap="0">
                <HStack bg="#FFFFFF4A" rounded="lg" px="2" py="1" gap="1">
                  <Text textStyle="xs" color="white" fontWeight="semibold" lineClamp={1}>
                    {footer}
                  </Text>
                </HStack>

                {title && (
                  <Text textStyle="md" color="white" fontWeight="bold" lineClamp={1}>
                    {title}
                  </Text>
                )}
              </VStack>
            </HStack>
          </LinkOverlay>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )

  return (
    <VStack
      position="relative"
      alignItems="flex-start"
      gap="8px"
      border="none"
      bg="#FFFFFF26"
      borderColor={"#FFFFFF33"}
      p="12px 16px"
      rounded="lg"
      flex={1}
      cursor={onCardClick ? "pointer" : "default"}
      onClick={onCardClick}>
      <HStack w="full" justifyContent="space-between">
        <Text display="block" textStyle="sm" color="white" fontWeight="semibold">
          {subtitle}
        </Text>
        {images && images?.length > 1 && (
          <HStack gap={1} textStyle="md" fontWeight="semibold">
            <Text color="white" fontWeight="semibold">
              {t("See all")}
            </Text>
            <FaChevronRight color="icon.default" size="14px" />
          </HStack>
        )}
      </HStack>

      <HStack alignItems="start">
        <AvatarGroup rounded="lg" shape="square" size="xl" stacking="last-on-top" spaceX={"-1.5rem"}>
          {images?.slice(0, 2)?.map(image => (
            <Avatar.Root key={image} border="none" rounded="lg">
              <Avatar.Image rounded="lg" src={image} />
            </Avatar.Root>
          ))}

          {plusCount > 0 && (
            <Avatar.Root rounded="lg" border="1px solid #E5EEFF" background="#6194F5">
              <Avatar.Fallback fontSize="12px">{`+${plusCount}`}</Avatar.Fallback>
            </Avatar.Root>
          )}
        </AvatarGroup>

        <VStack flex="1" flexDirection={"column-reverse"} alignItems="start" alignSelf="end" gap={0}>
          <HStack bg="#FFFFFF4A" rounded="lg" padding="4px 8px" gap={1}>
            <Text textStyle="xs" fontWeight="semibold" lineClamp={1}>
              {footer}
            </Text>
          </HStack>

          {title && (
            <Text fontWeight="bold" lineClamp={1}>
              {title}
            </Text>
          )}
        </VStack>
      </HStack>
    </VStack>
  )
}
