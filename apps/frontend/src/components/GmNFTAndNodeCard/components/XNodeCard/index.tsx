import { HStack, Image, Text, VStack } from "@chakra-ui/react"
import { FaChevronRight } from "react-icons/fa6"
import { useTranslation } from "react-i18next"

interface XNodeCardProps {
  xNodeName?: string
  xNodeImage?: string
  xNodePoints?: number
  isXNodeHolder: boolean
  isXNodeDelegator: boolean
  nodeAttachedColor: string
  viewMode?: boolean
  onCardClick?: () => void
}

export const XNodeCard = ({
  xNodeName,
  xNodeImage,
  xNodePoints,
  isXNodeHolder,
  isXNodeDelegator,
  nodeAttachedColor,
  viewMode,
  onCardClick,
}: XNodeCardProps) => {
  const { t } = useTranslation()

  if (!isXNodeHolder && !isXNodeDelegator) return null

  return (
    <HStack
      bg="#0D5DFB"
      p="9px 12px"
      border="1px solid"
      borderColor={nodeAttachedColor}
      justify="space-between"
      rounded="12px"
      gap={6}
      flex={1}
      cursor={viewMode ? "default" : "pointer"}
      onClick={viewMode ? undefined : onCardClick}>
      <Image src={xNodeImage} alt="xnode" w={"68px"} h={"68px"} rounded="8px" />
      <VStack flex="1" align={"flex-start"}>
        <Text fontWeight={700} lineClamp={1}>
          {xNodeName}
        </Text>
        <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
          <Text fontSize="xs" fontWeight={600}>
            {xNodePoints}
          </Text>
          <Text fontSize="xs" fontWeight={400}>
            {t("points")}
          </Text>
        </HStack>
      </VStack>
      <FaChevronRight size={"24px"} />
    </HStack>
  )
}
