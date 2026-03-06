import { Box, HStack, Text } from "@chakra-ui/react"

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
      gap="2"
      rounded="xl"
      p="12px 16px"
      position="relative"
      flex={1}
      cursor={onCardClick ? "pointer" : "default"}
      onClick={onCardClick}
      border="none"
      textAlign="left">
      <Box
        position="absolute"
        inset={0}
        rounded="xl"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="border.primary"
        pointerEvents="none"
      />
      {icon}
      <Text color="text.subtle">{text}</Text>
    </HStack>
  )
}
