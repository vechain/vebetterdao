import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useTranslation } from "react-i18next"
export const CreatorApplicationUnderReviewBanner = () => {
  const { t } = useTranslation()
  const title = t("CREATOR APPLICATION UNDER REVIEW")
  const description = t("Your Creator's NFT application is currently under review.")
  return (
    <GenericBanner
      title={title}
      description={description}
      logoSrc="/assets/images/creator-nft.webp"
      backgroundColor="#FFE6A1"
      backgroundImageSrc="/assets/backgrounds/cloud-background-orange.webp"
    />
  )
}
