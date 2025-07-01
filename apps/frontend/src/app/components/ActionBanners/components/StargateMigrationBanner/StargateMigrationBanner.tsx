import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { t } from "i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { GlassButton } from "@/components/GlassButton"

export const StargateMigrationBanner = () => {
  const GOTOSTARGATE = () => {
    window.open("https://stargate.vechain.org/", "_blank", "noopener noreferrer")
  }

  return (
    <GenericBanner
      title={t("STARGATE IS LIVE 🌌")}
      description={t("Migrate your legacy node to discover the new stargate universe !")}
      titleColor="#FFFFFF"
      descriptionColor="#E0E0E0"
      backgroundColor="transparent"
      logoSrc="/assets/images/b3mo-stargate.svg"
      backgroundImageSrc="/assets/backgrounds/stargate-background.svg"
      buttonIconPosition="right"
      buttonLabel={t("Explore")}
      onButtonClick={GOTOSTARGATE}
      buttonVariant="custom"
      customButton={
        <GlassButton onClick={GOTOSTARGATE} rightIcon={<UilArrowRight />}>
          {t("Explore")}
        </GlassButton>
      }
      imagePosition="top"
    />
  )
}
