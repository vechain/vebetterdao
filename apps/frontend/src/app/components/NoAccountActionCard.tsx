import { ConnectWalletButton } from "@/components"
import { Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaWallet } from "react-icons/fa"

export const NoAccountActionCard = () => {
  const { t } = useTranslation()
  return (
    <VStack gap={4} bg="light-contrast-on-card-bg" align="center" w="full" borderRadius="md" py="16px" px="28px">
      <Image src="/assets/icons/hand-plant.svg" boxSize={"78px"} color="#757575" alt="No proposals" />
      <Text fontSize={"16px"} fontWeight={500} color={"#757575"} textAlign="center">
        {t("Create or connect a wallet to start doing Better Actions")}
      </Text>
      <ConnectWalletButton
        connectionVariant="modal"
        buttonStyleProps={{
          bg: "#E0E9FE",
          textColor: "#004CFC",
          px: 10,
          leftIcon: <FaWallet />,
        }}
      />
    </VStack>
  )
}
