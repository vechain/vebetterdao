import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

export const CreatorApplicationApprovedBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const navigateToSubmitAppForm = () => {
    router.push("/apps/new/form")
  }
  return (
    <GenericBanner
      title={t("Creator's nft received")}
      description={t("Your Creator application was approved. Submit your app!")}
      illustration="/assets/images/creator-nft.webp"
      cta={
        <Button size={{ base: "sm", md: "md" }} onClick={navigateToSubmitAppForm} variant="primary">
          {t("Submit app")}
        </Button>
      }
    />
  )
}
