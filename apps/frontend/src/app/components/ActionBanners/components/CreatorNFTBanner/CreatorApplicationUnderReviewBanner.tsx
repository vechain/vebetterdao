import { useTranslation } from "react-i18next"

import { BannerStorageKey, GenericBanner } from "@/app/components/Banners/GenericBanner"

export const CreatorApplicationUnderReviewBanner = () => {
  const { t } = useTranslation()
  return (
    <GenericBanner
      title={t("Creator application under review")}
      description={t("Your Creator's NFT application is currently under review.")}
      illustration="/assets/images/creator-nft.webp"
      storageKey={BannerStorageKey.SHOW_CREATOR_NFT}
    />
  )
}
