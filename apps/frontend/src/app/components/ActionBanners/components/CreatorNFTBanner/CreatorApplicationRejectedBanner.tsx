import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export const CreatorApplicationRejectedBanner = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const navigateToCreatorForm = () => {
    return router.push("/apps/creator/new")
  }

  const title = t("CREATOR APPLICATION REJECTED")
  const description = t("Your Creator's NFT application was rejected")
  const doAction = t("Apply again")

  return (
    <GenericBanner
      title={title}
      description={description}
      logoSrc="/assets/mascot/mascot-warning-head.webp"
      backgroundImageSrc="/assets/backgrounds/cloud-background-orange.webp"
      backgroundColor="#FFD979"
      buttonLabel={doAction}
      onButtonClick={navigateToCreatorForm}
      buttonvariant="primary"
      buttonIcon={<UilArrowRight />}
    />
  )
}
