import { UilChatBubbleUser } from "@iconscout/react-unicons"
import { GenericBanner } from "../../Banners/GenericBanner"
import { useWalletModal } from "@vechain/vechain-kit"

export const VechainKitBanner = () => {
  //TODO: Update this banner and use the correct translations
  //   const { t } = useTranslation()
  const { open } = useWalletModal()
  return (
    <GenericBanner
      title={"VECHAIN LOGIN IS OUT!"}
      titleColor="#3A5798"
      description={"Connect your VeChain wallet to start earning rewards!"}
      descriptionColor="#0C2D75"
      logoSrc="/images/logo/pictogram.png"
      backgroundColor="#C8DDFF"
      backgroundImageSrc="/images/cloud-background.png"
      buttonLabel={"Try it now"}
      onButtonClick={open}
      buttonVariant="primaryAction"
      buttonIcon={<UilChatBubbleUser color="#C8DDFF" />}
    />
  )
}
