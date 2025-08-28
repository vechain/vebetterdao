import { useTranslation } from "react-i18next"
import { UilArrowRight } from "@iconscout/react-unicons"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useBuyVtho } from "@/hooks/useTransak"

export const LowVthoBanner = () => {
  const { t } = useTranslation()
  const { initTransak } = useBuyVtho()

  return (
    <GenericBanner
      title={t("NOT ENOUGH VTHO")}
      titleColor="#8D6602"
      description={t("Get more VTHO to be able to vote and perform transactions!")}
      descriptionColor="#5F4400"
      logoSrc="/assets/icons/lightning.webp"
      backgroundColor="#FFD979"
      backgroundImageSrc="/assets/backgrounds/cloud-background-orange.webp"
      buttonLabel={t("Get more VTHO")}
      onButtonClick={initTransak}
      buttonVariant="primaryAction"
      buttonIcon={<UilArrowRight />}
    />
  )
}
