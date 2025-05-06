import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useRouter } from "next/navigation"
import { UilArrowRight } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const GMPoolRewardsBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()

  const UPGRADE = () => {
    router.push("/galaxy-member")
  }

  return (
    <GenericBanner
      title={t("GM Rewards Pool is live from Round 46 💰")}
      description={t("GM Rewards Pool starts from Round 46. Upgrade your GM to earn more!")}
      descriptionColor="#0A1C42"
      titleColor="#3A5798"
      logoSrc="/images/new-app-gold.svg"
      backgroundColor="#C8DDFF"
      backgroundImageSrc="/images/cloud-background.png"
      buttonIconPosition="right"
      buttonLabel={t("Upgrade your GM")}
      onButtonClick={UPGRADE}
      buttonVariant="primaryAction"
      buttonIcon={<UilArrowRight />}
    />
  )
}
