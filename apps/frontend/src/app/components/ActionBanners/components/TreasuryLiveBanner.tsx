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
      variant="b3mo"
      illustration="/assets/mascot/mascot-data.png"
      storageKey={BannerStorageKey.SHOW_TREASURY_LIVE}
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="secondary" onClick={handleClick}>
          {t("View Treasury")}
        </Button>
      }
    />
  )
}
