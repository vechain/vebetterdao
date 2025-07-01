import { GenericBanner } from "@/app/components/Banners/GenericBanner"
// import { useRouter } from "next/navigation"
import { t } from "i18next"
import { UilArrowRight } from "@iconscout/react-unicons"

export const LegacyNodeBanner = () => {
  //   const router = useRouter()

  const GOTOSTARGATE = () => {
    console.log("GOTOSTARGATE")
  }

  return (
    <GenericBanner
      title={t("MIGRATE YOUR LEGACY NODE TO STARGATE")}
      description={t("Your legacy node ...")}
      titleColor="#3A5798"
      descriptionColor="#0C2D75"
      logoSrc="/assets/icons/new-app-gold.svg"
      backgroundColor="#C8DDFF"
      backgroundImageSrc="/assets/backgrounds/cloud-background.webp"
      buttonIconPosition="right"
      buttonLabel={t("Explore")}
      onButtonClick={GOTOSTARGATE}
      buttonVariant="primaryAction"
      buttonIcon={<UilArrowRight />}
    />
  )
}
