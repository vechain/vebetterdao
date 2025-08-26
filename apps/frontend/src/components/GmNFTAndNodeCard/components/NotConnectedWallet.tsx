import { ConnectWalletButton } from "@/components/ConnectWalletButton"
import { WalletIcon } from "@/components/Icons/WalletIcon"
import { Card, Stack, Text, useMediaQuery } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const NotConnectedWallet = () => {
  const [isAbove1200] = useMediaQuery(["(min-width: 1200px)"])
  const { t } = useTranslation()
  return (
    <Card.Root
      bg="#004CFC"
      rounded="12px"
      p="24px"
      color="white"
      position="relative"
      overflow={"hidden"}
      bgImage={"/assets/backgrounds/cloud-background.webp"}
      bgSize="cover"
      backgroundPosition="center"
      bgRepeat="no-repeat">
      <Stack justify={"space-between"} direction={isAbove1200 ? "row" : "column"} align="center" gap="24px">
        <Stack direction={isAbove1200 ? "row" : "column"} gap="24px" align="center">
          <WalletIcon />
          <Stack align="stretch">
            <Text fontSize="2xl" fontWeight={600} textAlign={isAbove1200 ? "left" : "center"}>
              {t("Wallet not connected")}
            </Text>
            <Text textAlign={isAbove1200 ? "left" : "center"}>
              {t("Connect your wallet to see your balance, earn rewards and mint NFTs.")}
            </Text>
          </Stack>
        </Stack>
        <ConnectWalletButton
          connectionVariant="modal"
          buttonStyleProps={{
            bg: "#E0E9FE",
            color: "#004CFC",
            px: 10,
          }}
        />
      </Stack>
    </Card.Root>
  )
}
