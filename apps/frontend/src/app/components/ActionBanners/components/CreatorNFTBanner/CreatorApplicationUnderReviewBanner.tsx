import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const CreatorApplicationUnderReviewBanner = () => {
  const { t } = useTranslation()
  return (
    <GenericBanner
      variant="info"
      title={t("CREATOR APPLICATION UNDER REVIEW")}
      description={t("Your Creator's NFT application is currently under review.")}
      illustration="/assets/images/creator-nft.webp"
    />
  )
}
