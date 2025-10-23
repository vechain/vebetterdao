import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const CreatorApplicationRejectedBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const navigateToCreatorForm = () => {
    return router.push("/apps/creator/new")
  }
  return (
    <GenericBanner
      title={t("Creator application rejected")}
      description={t("Your Creator's NFT application was rejected")}
      illustration="/assets/mascot/mascot-warning-head.webp"
      cta={
        <Button onClick={navigateToCreatorForm} variant="primary">
          {t("Apply again")}
        </Button>
      }
    />
  )
}
