import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { Button, Icon } from "@chakra-ui/react"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export const CreatorApplicationRejectedBanner = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const navigateToCreatorForm = () => {
    return router.push("/apps/creator/new")
  }

  return (
    <GenericBanner
      variant="warning"
      title={t("CREATOR APPLICATION REJECTED")}
      description={t("Your Creator's NFT application was rejected")}
      logoSrc="/assets/mascot/mascot-warning-head.webp"
      cta={
        <Button onClick={navigateToCreatorForm} variant="primary">
          <Icon as={UilArrowRight} color="white" />
          {t("Apply again")}
        </Button>
      }
    />
  )
}
