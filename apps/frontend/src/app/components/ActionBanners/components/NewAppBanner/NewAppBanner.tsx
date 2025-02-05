import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useRouter } from "next/navigation"
import { t } from "i18next"
import { useMemo } from "react"
import { useXApps } from "@/api"
import { UilArrowUpRight } from "@iconscout/react-unicons"

export const NewAppBanner = () => {
  const router = useRouter()
  const { data: xApps } = useXApps()

  const GOTOAPPS = () => {
    router.push("/apps")
  }

  const newAppsList = useMemo(() => {
    return xApps?.newApps
  }, [xApps])

  const description = useMemo(() => {
    if (!newAppsList || newAppsList?.length === 0) return ""

    if (newAppsList?.length === 1 && newAppsList[0]) {
      return t("{{value}} just joined the DAO! Get involved in the app now!", { value: newAppsList[0].name })
    }

    return t("{{name}} and {{count}} more just joined the DAO! Get involved in the app now!", {
      name: newAppsList[0]?.name,
      count: newAppsList.length - 1,
    })
  }, [newAppsList])

  return (
    <GenericBanner
      title={t("NEW APP AVAILABLE")}
      description={description}
      titleColor="#3A5798"
      descriptionColor="#0C2D75"
      logoSrc="/images/new-app-gold.svg"
      backgroundColor="#CBDDFF"
      backgroundImageSrc="/images/gold-cloud-full.png"
      buttonLabel={t("Explore")}
      onButtonClick={GOTOAPPS}
      buttonVariant="primaryAction"
      buttonIcon={<UilArrowUpRight />}
    />
  )
}
