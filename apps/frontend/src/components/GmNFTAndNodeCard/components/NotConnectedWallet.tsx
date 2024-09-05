import { WalletIcon } from "@/components/Icons/WalletIcon"
import { Box, Button, Card, Image, Stack, Text, useMediaQuery } from "@chakra-ui/react"
import { UilWallet } from "@iconscout/react-unicons"
import { useWalletModal } from "@vechain/dapp-kit-react"
import { useTranslation } from "react-i18next"

export const NotConnectedWallet = () => {
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const { t } = useTranslation()
  const { open } = useWalletModal()
  return (
    <Card bg="#004CFC" rounded="12px" p="24px" color="white" position="relative" overflow={"hidden"}>
      <Box
        position="absolute"
        top={isAbove1200 ? "-50%" : "-10%"}
        left={isAbove1200 ? "0" : "-50%"}
        w={isAbove1200 ? "100%" : "200%"}
        h="auto">
        <Image src={"/images/cloud-background.png"} alt="cloud" objectFit={"contain"} />
      </Box>
      <Stack justify={"space-between"} direction={isAbove1200 ? "row" : "column"} align="center" gap="24px">
        <Stack direction={isAbove1200 ? "row" : "column"} gap="24px" zIndex={"2"} align="center">
          <WalletIcon />
          <Stack align="stretch">
            <Text fontSize="2xl" fontWeight={600} align={isAbove1200 ? "left" : "center"}>
              {t("Wallet not connected")}
            </Text>
            <Text align={isAbove1200 ? "left" : "center"}>
              {t("Connect your wallet to see your balance, earn rewards and mint NFTs.")}
            </Text>
          </Stack>
        </Stack>
        <Button
          zIndex={"2"}
          onClick={open}
          leftIcon={<UilWallet size={"16px"} />}
          variant={"whiteAction"}
          rounded={"full"}
          fontWeight={500}
          px="24px">
          {t("Connect Wallet")}
        </Button>
      </Stack>
    </Card>
  )
}
