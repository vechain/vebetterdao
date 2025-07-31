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
        <AvatarGroup
          size="md"
          max={2}
          spacing={"-1.5rem"}
          sx={{
            ".chakra-avatar__excess": {
              borderRadius: "8px",
              border: "1px solid #E5EEFF",
              background: "#6194F5",
              fontSize: "12px",
              zIndex: 1000,
            },
          }}>
          {images?.map((image, index) => (
            <Avatar key={image} name={image} src={image} border="none" borderRadius="8px" zIndex={100 + index} />
          ))}
        </AvatarGroup>

        <VStack flex="1" flexDirection={"column-reverse"} alignItems="start" alignSelf="end" spacing={0}>
          <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
            <Text fontSize="xs" fontWeight={600} noOfLines={1}>
              {footer}
            </Text>
          </HStack>

          {title && (
            <Text fontWeight={700} noOfLines={1}>
              {title}
            </Text>
          )}
        </VStack>
      </HStack>
    </VStack>
  )
}
