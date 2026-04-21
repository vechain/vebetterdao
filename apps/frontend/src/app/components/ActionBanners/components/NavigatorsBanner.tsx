import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { BannerStorageKey, GenericBanner } from "@/app/components/Banners/GenericBanner"

export const NavigatorsBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <GenericBanner
      illustration="/assets/mascot/navigator-b3mo.png"
      illustrationDimensions={{ width: { base: "180px", md: "210px" }, height: { base: "180px", md: "210px" } }}
      title={t("Meet the Navigators")}
      description={t(
        "Engaged community members who vote on your behalf—with public rationale, merit-based judgment, and skin in the game. Delegate your VOT3 to a strategy you trust instead of lazy voting.",
      )}
      storageKey={BannerStorageKey.SHOW_NAVIGATORS}
      cta={
        <Button size={{ base: "sm", md: "md" }} variant="primary" onClick={() => router.push("/navigators")}>
          {t("Explore Navigators")}
        </Button>
      }
    />
  )
}
