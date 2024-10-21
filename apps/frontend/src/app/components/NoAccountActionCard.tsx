import { Button, Image, Text, VStack } from "@chakra-ui/react"
import { UilWallet } from "@iconscout/react-unicons"
import { useWalletModal } from "@vechain/dapp-kit-react"
import { useTranslation } from "react-i18next"

export const NoAccountActionCard = () => {
  const { t } = useTranslation()
  const { open } = useWalletModal()
  return (
    <VStack spacing={4} bg="#F8F8F8" align="center" w="full" borderRadius="md" py="16px" px="28px">
      <Image src="/images/hand-plant.svg" boxSize={"78px"} color="#757575" alt="No proposals" />
      <Text fontSize={"16px"} fontWeight={500} color={"#757575"} textAlign="center">
        {t("Create or connect a wallet to start doing Better Actions")}
      </Text>
      <Button
        rounded={"full"}
        border="2px solid #004CFC"
        colorScheme="#004CFC"
        color="#004CFC"
        _hover={{
          opacity: 0.6,
        }}
        leftIcon={<UilWallet color="#004CFC" />}
        onClick={open}>
        {t("Connect wallet")}
      </Button>
    </VStack>
  )
}
