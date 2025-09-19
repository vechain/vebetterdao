import { ConnectWalletButton } from "@/components/ConnectWalletButton"
import WalletIcon from "@/components/Icons/svg/wallet.svg"
import { Card, Stack, Text, useMediaQuery, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const NotConnectedWallet = () => {
  const [isAbove1200] = useMediaQuery(["(min-width: 1200px)"])
  const { t } = useTranslation()
  return (
    <Card.Root
      bg="banner.blue"
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
          <Icon as={WalletIcon} boxSize="116px" color="icon.default" />
          <Stack align="stretch">
            <Text textStyle="2xl" fontWeight="semibold" textAlign={isAbove1200 ? "left" : "center"}>
              {t("Wallet not connected")}
            </Text>
            <Text textStyle="md" textAlign={isAbove1200 ? "left" : "center"}>
              {t("Connect your wallet to see your balance, earn rewards and mint NFTs.")}
            </Text>
          </Stack>
        </Stack>
        <ConnectWalletButton
          connectionVariant="modal"
          buttonStyleProps={{
            px: "10",
            rounded: "full",
            color: "var(--vbd-colors-actions-primary-text)",
            bgColor: "var(--vbd-colors-actions-primary-default)",
            _hover: { bg: "var(--vbd-colors-actions-primary-hover)" },
            _disabled: { bg: "var(--vbd-colors-actions-primary-disabled)" },
            _focus: { bg: "var(--vbd-colors-actions-primary-pressed)" },
          }}
        />
      </Stack>
    </Card.Root>
  )
}
