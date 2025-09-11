import { chakra, HStack, Text } from "@chakra-ui/react"

export const GmEmptyStateCard = ({
  icon,
  text,
  onCardClick,
}: {
  icon: React.ReactNode
  text: string
  onCardClick?: () => void
}) => {
  return (
    <HStack
      as={"button"}
      w="100%"
      height={"100%"}
      gap={1}
      rounded="12px"
      p="12px 16px"
      position="relative"
      flex={1}
      cursor={onCardClick ? "pointer" : "default"}
      onClick={onCardClick}
      border="none">
      <chakra.svg width="100%" height="100%" position="absolute" top={0} left={0} right={0} bottom={0}>
        <rect
          width="100%"
          height="100%"
          fill="none"
          rx="12"
          ry="12"
          stroke="#FFFFFF80"
          strokeWidth="1"
          strokeDasharray="12,12"
          strokeDashoffset="2"
          strokeLinecap="square"
        />
      </chakra.svg>
      {icon}
      <Text color={"#FFFFFF80"}>{text}</Text>
    </HStack>
  )
}
