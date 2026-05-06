import { Box, Button } from "@chakra-ui/react"
import { useWalletModal } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const GuestConnectWalletBanner = () => {
  const { t } = useTranslation()
  const { open } = useWalletModal()
  return (
    <GenericBanner
      variant="b3mo"
      illustration="/assets/mascot/mascot-holding-tokens.webp"
      illustrationDimensions={{ width: { base: "120px", md: "168px" }, height: { base: "120px", md: "168px" } }}
      title={t("Connect your wallet to create or join a quest")}
      description={t("Browse what others are doing below, then connect to participate.")}
      cta={
        <Box maxW={{ base: "full", md: "320px" }} w="full">
          <Button variant="primary" size="md" w="full" onClick={() => open()}>
            {t("Create B3MO Quest")}
          </Button>
        </Box>
      }
    />
  )
}
