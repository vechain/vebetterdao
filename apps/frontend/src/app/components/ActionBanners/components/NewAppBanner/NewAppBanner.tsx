import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { t } from "i18next"
import { useXApps } from "@/api"
import { UilArrowRight } from "@iconscout/react-unicons"
interface NewApp {
  name: string
}

export const NewAppBanner = () => {
  const router = useRouter()
  const { data: xApps } = useXApps()

  const GOTOAPPS = () => {
    router.push("/apps")
  }

  const newAppsList = useMemo((): NewApp[] | undefined => {
    return xApps?.newApps
  }, [xApps])

  const areManyNewApps = useMemo(() => {
    return newAppsList ? newAppsList.length > 1 : false
  }, [newAppsList])

  const newAppsListNames = useMemo(() => {
    return newAppsList?.map(app => app.name)
  }, [newAppsList])

  const description = useMemo(() => {
    if (!newAppsList || newAppsList?.length === 0 || !newAppsListNames?.length) return ""

    const firstAppName = newAppsListNames[0]
    const count = newAppsListNames.length - 1
    if (!firstAppName) return ""

    if (areManyNewApps) {
      return `${firstAppName} ${t("and {{count}} more just joined the DAO! Get involved in the app now!", {
        count,
      })}`
    }

    return `${firstAppName} ${t("just joined the DAO! Get involved in the app now!")}`
  }, [newAppsList, areManyNewApps, newAppsListNames])

  return (
    <GenericBanner
      title={t("NEW APP AVAILABLE")}
      description={description}
      titleColor="#3A5798"
      descriptionColor="#0C2D75"
      logoSrc="/images/new-app-gold.svg"
      backgroundColor="#C8DDFF"
      backgroundImageSrc="/images/cloud-background.png"
      buttonIconPosition="right"
      buttonLabel={t("Explore")}
      onButtonClick={GOTOAPPS}
      buttonVariant="primaryAction"
      buttonIcon={<UilArrowRight />}
    />
  )
}
