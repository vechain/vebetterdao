import { Button, Icon } from "@chakra-ui/react"
import { UilArrowRight } from "@iconscout/react-unicons"
import { t } from "i18next"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

import { useXApps } from "../../../../../api/contracts/xApps/hooks/useXApps"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

interface NewApp {
  name: string
  id: string
}
export const NewAppBanner = () => {
  const router = useRouter()
  const { data: xApps } = useXApps()
  const newAppsList = useMemo((): NewApp[] | undefined => {
    return xApps?.newApps
  }, [xApps])
  const areManyNewApps = newAppsList && newAppsList.length > 1
  const newAppsListNames: string[] | undefined = newAppsList?.map(app => app.name)
  const description = useMemo(() => {
    if (newAppsList?.length === 0) return ""
    const firstAppName = newAppsList?.[0]?.name
    if (!firstAppName) return ""
    const count = (newAppsListNames?.length ?? 0) - 1
    if (areManyNewApps) {
      return `${firstAppName} ${t("and {{count}} more just joined the DAO! Get involved in the app now!", {
        count,
      })}`
    }
    return `${firstAppName} ${t("just joined the DAO! Get involved in the app now!")}`
  }, [newAppsList, areManyNewApps, newAppsListNames])
  const GOTOAPPS = () => {
    if (areManyNewApps) {
      router.push("/apps")
    } else {
      router.push(`/apps/${newAppsList?.[0]?.id}`)
    }
  }

  return (
    <GenericBanner
      variant="info"
      title={t("NEW APP AVAILABLE")}
      description={description}
      logoSrc="/assets/icons/new-app-gold.svg"
      cta={
        <Button onClick={GOTOAPPS} variant="primary">
          {t("Explore")}
          <Icon as={UilArrowRight} />
        </Button>
      }
    />
  )
}
