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
    <VStack w={"full"} borderRadius={8} bg={"#F8F8F8"}>
      <Text fontSize={{ base: 18, md: 20 }} fontWeight={"bold"} alignSelf={"start"}>
        {t(title as any)}
      </Text>
      {illustration}
      <Text>{description}</Text>
      <Button
        mt={2}
        rounded={"full"}
        variant={"outline"}
        colorScheme="primary"
        leftIcon={buttonIcon && <Icon as={buttonIcon} />}
        onClick={onClick}>
        {t(buttonText as any)}
      </Button>
    </VStack>
  )
}
