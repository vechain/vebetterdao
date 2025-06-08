import { Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const NoActiveProposalCard = () => {
  const { t } = useTranslation()
  return (
    <VStack spacing={4} bg="info-bg" align="center" w="full" borderRadius="md" py="16px" px="56px">
      <Image src="/assets/icons/no-proposals-icon.svg" boxSize={"78px"} color="#757575" alt="No proposals" />
      <Text fontSize={"16px"} fontWeight={500} color={"#757575"} textAlign="center">
        {t("There are no active proposals in this round")}
      </Text>
    </VStack>
  )
}
