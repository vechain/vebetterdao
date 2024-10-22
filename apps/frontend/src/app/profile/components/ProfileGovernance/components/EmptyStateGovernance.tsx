import { VStack, Text, Button, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
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
  const { t } = useTranslation()

  return (
    <VStack w={"full"}>
      <Text fontSize={{ base: 18, md: 20 }} fontWeight={"bold"} alignSelf={"start"}>
        {t(title as any)}
      </Text>
      <VStack w={"full"} borderRadius={12} borderWidth={1} borderColor={"#D5D5D5"} p={10}>
        {illustration}
        <Text>{description}</Text>
        <Button
          mt={2}
          rounded={"full"}
          variant={"primaryAction"}
          colorScheme="primary"
          leftIcon={buttonIcon && <Icon as={buttonIcon} />}
          onClick={onClick}>
          {t(buttonText as any)}
        </Button>
      </VStack>
    </VStack>
  )
}
