import { Avatar, Text, VStack, HStack, AvatarGroup } from "@chakra-ui/react"
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
    <VStack
      position="relative"
      alignItems="flex-start"
      gap="8px"
      border="none"
      bg="#FFFFFF26"
      borderColor={"#FFFFFF33"}
      p="12px 16px"
      rounded="8px"
      flex={1}
      cursor={onCardClick ? "pointer" : "default"}
      onClick={onCardClick}>
      <HStack w="full" justifyContent="space-between">
        <Text display="block" fontSize="sm" color="#FFFFFFB2">
          {subtitle}
        </Text>
        {images && images?.length > 1 && (
          <HStack gap={1} fontSize="14px" fontWeight={500} lineHeight={1}>
            <Text>{t("See all")}</Text>
            <FaChevronRight size="14px" />
          </HStack>
        )}
      </HStack>

      <HStack alignItems="start">
        <AvatarGroup rounded="8px" shape="square" size="md" stacking="last-on-top" spaceX={"-1.5rem"}>
          {images?.slice(0, 2)?.map(image => (
            <Avatar.Root key={image} border="none" rounded="8px">
              <Avatar.Image rounded="8px" src={image} />
            </Avatar.Root>
          ))}

          {plusCount > 0 && (
            <Avatar.Root rounded="8px" border="1px solid #E5EEFF" background="#6194F5">
              <Avatar.Fallback fontSize="12px">{`+${plusCount}`}</Avatar.Fallback>
            </Avatar.Root>
          )}
        </AvatarGroup>

        <VStack flex="1" flexDirection={"column-reverse"} alignItems="start" alignSelf="end" gap={0}>
          <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
            <Text fontSize="xs" fontWeight={600} lineClamp={1}>
              {footer}
            </Text>
          </HStack>

          {title && (
            <Text fontWeight={700} lineClamp={1}>
              {title}
            </Text>
          )}
        </VStack>
      </HStack>
    </VStack>
  )
}
