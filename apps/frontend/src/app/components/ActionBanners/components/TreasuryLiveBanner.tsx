import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { BannerStorageKey, GenericBanner } from "../../Banners/GenericBanner"

export const TreasuryLiveBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const handleClick = useCallback(() => {
    router.push("/treasury")
  }, [router])

  return (
    <GenericBanner
      title={t("The Treasury page is now live!")}
      description={t("Track community treasury balance and transfers in real time.")}
      variant="default"
      illustration="/assets/3d-illustrations/chart.png"
      storageKey={BannerStorageKey.SHOW_TREASURY_LIVE}
      illustrationDimensions={{ width: "200px", height: "200px" }}
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={handleClick}>
          {t("View Treasury")}
        </Button>
      }
    />
  )
}
