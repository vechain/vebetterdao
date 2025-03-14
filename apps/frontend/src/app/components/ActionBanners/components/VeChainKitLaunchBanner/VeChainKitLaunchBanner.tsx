import { useWallet, useAccountModal } from "@vechain/vechain-kit"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { AddressIcon } from "@/components/AddressIcon"
import { UilBoltAlt } from "@iconscout/react-unicons"

export const VeChainKitLaunchBanner = () => {
  const { account } = useWallet()
  const { open: openAccount } = useAccountModal()

  return (
    <GenericBanner
      title="NEW FEATURE AVAILABLE"
      titleColor="#3A5798"
      description="Click on your avatar and customise your profile, manage your assets and more!"
      descriptionColor="#0C2D75"
      logoSrc={
        <AddressIcon
          address={account?.address ?? ""}
          rounded="full"
          boxSize={{ base: "56px", md: "64px", lg: "72px" }}
          maxWidth="72px"
          maxHeight="72px"
        />
      }
      backgroundColor="#B1F16C"
      backgroundImageSrc="/images/community-green-blob.png"
      buttonIcon={<UilBoltAlt />}
      buttonIconPosition="right"
      buttonLabel="Try It"
      buttonVariant="primaryAction"
      onButtonClick={openAccount}
    />
  )
}
