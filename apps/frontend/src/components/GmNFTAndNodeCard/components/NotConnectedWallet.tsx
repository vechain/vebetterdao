import { Card, Stack, Text, Image } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { ConnectWalletButton } from "../../ConnectWalletButton/ConnectWalletButton"

export const NotConnectedWallet = () => {
  const { t } = useTranslation()
  return (
    <Card.Root
      variant="outline"
      rounded="12px"
      p="24px"
      w="full"
      color="white"
      position="relative"
      overflow={"hidden"}
      bgImage={"/assets/backgrounds/cloud-background.webp"}
      bgSize="cover"
      backgroundPosition="center"
      bgRepeat="no-repeat">
      <Stack justify={"space-between"} direction={"column"} align="center" gap="24px" w="full">
        <Stack direction={"column"} gap="0" align="center">
          <Image src="/assets/3d-illustrations/wallet.png" alt="Wallet not connected" />
          <Stack align="stretch">
            <Text textStyle="xl" fontWeight="semibold" textAlign={"center"}>
              {t("Wallet not connected")}
            </Text>
            <Text textStyle="md" textAlign={"center"}>
              {t("Connect your wallet to see your balance, earn rewards and mint NFTs.")}
            </Text>
          </Stack>
        </Stack>
        <ConnectWalletButton
          connectionVariant="modal"
          buttonStyleProps={{
            px: "10",
            rounded: "full",
            width: "full",
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
