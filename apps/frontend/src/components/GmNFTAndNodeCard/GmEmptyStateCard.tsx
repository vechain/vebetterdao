import { HStack, Text } from "@chakra-ui/react"

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
      height={"100%"}
      gap={1}
      rounded="12px"
      p="24px 12px"
      position="relative"
      flex={1}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='99%25' fill='none' rx='12' ry='12' stroke='%23FFFFFF80' stroke-width='1' stroke-dasharray='12%2c 12' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
      }}
      cursor={onCardClick ? "pointer" : "default"}
      onClick={onCardClick}>
      {icon}
      <Text color={"#FFFFFF80"}>{text}</Text>
    </HStack>
  )
}
