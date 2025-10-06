import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { Button, Icon } from "@chakra-ui/react"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

export const CreatorApplicationApprovedBanner = () => {
  const { t } = useTranslation()

  const router = useRouter()
  const navigateToSubmitAppForm = () => {
    router.push("/apps/new/form")
  }

  return (
    <GenericBanner
      variant="info"
      title={t("CREATOR'S NFT RECEIVED")}
      description={t("Your Creator application was approved. Submit your app!")}
      logoSrc="/assets/images/creator-nft.webp"
      cta={
        <Button onClick={navigateToSubmitAppForm} variant="primary">
          <Icon as={UilArrowRight} color="white" />
          {t("Submit app")}
        </Button>
      }
    />
  )
}
