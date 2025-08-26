import { VStack, Text, Button, Icon } from "@chakra-ui/react"
import { IconType } from "react-icons"

type Props = {
  title: string
  description: string
  buttonText: string
  illustration: React.ReactNode
  buttonIcon?: IconType
  onClick: () => void
}

export const EmptyStateGovernance = ({ title, description, illustration, buttonText, buttonIcon, onClick }: Props) => {
  return (
    <VStack w={"full"}>
      <Text fontSize={{ base: 18, md: 20 }} fontWeight={"bold"} alignSelf={"start"}>
        {title}
      </Text>
      <VStack w={"full"} borderRadius={12} borderWidth={1} borderColor={"#D5D5D5"} p={10}>
        {illustration}
        <Text>{description}</Text>
        <Button mt={2} rounded={"full"} variant={"primaryAction"} colorPalette="primary" onClick={onClick}>
          {buttonIcon && <Icon as={buttonIcon} />}
          {buttonText}
        </Button>
      </VStack>
    </VStack>
  )
}
