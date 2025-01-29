import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { t } from "i18next"
import { useRouter } from "next/navigation"
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
      return t("{{value}} has joined the DAO, take part in the new app now!", { value: newAppsList[0].name })
    }

    return t("{{name}} and {{count}} more have joined the DAO, take part in the new apps now!", {
      name: newAppsList[0]?.name,
      count: newAppsList.length - 1,
    })
  }, [newAppsList, t])

  return (
    <GenericBanner
      title={t("NEW APP AVAILABLE! 🎉")}
      titleColor="#3A5798"
      descriptionColor="#0C2D75"
      description={description}
      logoSrc="/images/new-app-blue.svg"
      backgroundColor="#CBDDFF"
      backgroundImageSrc="/images/blue-cloud-full.png"
      buttonLabel={t("Explore")}
      onButtonClick={GOTOAPPS}
      buttonVariant="primaryAction"
      buttonIcon={<UilArrowUpRight />}
    />
  )
}
