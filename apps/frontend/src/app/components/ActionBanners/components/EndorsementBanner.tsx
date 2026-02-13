import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { BannerStorageKey, GenericBanner } from "../../Banners/GenericBanner"

export const EndorsementBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const handleClick = useCallback(() => {
    router.push("/nodes")
  }, [router])

  return (
    <GenericBanner
      title={t("New Endorsement system is here!")}
      description={t("Node holders can now endorse multiple apps at once, with a new points system.")}
      illustration="/assets/icons/hands-shaking.png"
      storageKey={BannerStorageKey.SHOW_ENDORSEMENT}
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={handleClick}>
          {t("Go to Nodes")}
        </Button>
      }
    />
  )
}
