import { useTranslation } from "react-i18next"
import { UilBoltAlt } from "@iconscout/react-unicons"
import { useWallet, useAccountModal } from "@vechain/vechain-kit"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { AddressIcon } from "@/components/AddressIcon"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "@/constants"
import { AnalyticsUtils } from "@/utils"

export const VeChainKitLaunchBanner = () => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { open: openAccount } = useAccountModal()
  const buttonClickProperties = () => {
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.BANNER_VECHAIN_KIT_LAUNCH))
  }

  return (
    <GenericBanner
      title={t("NEW FEATURE AVAILABLE")}
      titleColor="#3A5798"
      description={t("Click on your avatar and customise your profile, manage your assets and more!")}
      descriptionColor="#0C2D75"
      logoSrc={
        <AddressIcon
          address={account?.address ?? ""}
          rounded="full"
          minW={20}
          minH={20}
          boxSize={{ base: "56px", md: "64px", lg: "72px" }}
          maxWidth="72px"
          maxHeight="72px"
        />
      }
      backgroundColor="#B1F16C"
      backgroundImageSrc="/assets/backgrounds/community-green-blob.webp"
      buttonIcon={<UilBoltAlt />}
      buttonIconPosition="right"
      buttonLabel={t("Try It")}
      buttonVariant="primaryAction"
      onButtonClick={() => {
        openAccount()
        buttonClickProperties()
      }}
    />
  )
}
