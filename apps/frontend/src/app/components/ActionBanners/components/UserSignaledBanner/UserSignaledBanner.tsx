import { Trans, useTranslation } from "react-i18next"
import { useWallet } from "@vechain/dapp-kit-react"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useUserSignalEvents } from "@/api/contracts/xApps/hooks/useUserSignalEvents"
import { useXApps } from "@/api"
import { Text } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"

export const UserSignaledBanner = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userSignals } = useUserSignalEvents(account ?? "")
  const { data: apps } = useXApps()

  const getAppDetails = (appId: string) => apps?.allApps.find(app => app.id === appId)

  const signalGroupedByApp = userSignals?.reduce<Record<string, string[]>>((acc, signal) => {
    const appName = getAppDetails(signal.appId)?.name ?? "Unknown"
    if (signal.reason) {
      acc[appName] = acc[appName] || []
      acc[appName].push(signal.reason)
    }
    return acc
  }, {})

  const appNames = Object.keys(signalGroupedByApp || {})
  const formatAppNames = (appNames: string[]) => {
    const MAX_LENGTH = 40

    if (appNames.length > 3 || appNames.join(", ").length > MAX_LENGTH) return "many apps"
    if (appNames.length === 2) return `${appNames[0]} and ${appNames[1]}`
    if (appNames.length > 2) {
      const lastApp = appNames.pop()
      return `${appNames.join(", ")} and ${lastApp}`
    }
    return appNames.join("")
  }

  const appSignals = formatAppNames(appNames)

  return (
    <GenericBanner
      title={t("YOU HAVE BEEN SIGNALED")}
      titleColor="#8D6602"
      description={
        <Text fontSize="lg" fontWeight="700" color="#5F4400">
          <Trans
            as="span"
            i18nKey="You have been signaled by <em>{{appSignals}}</em>. <br/>If you believe this signal is unfair, please reach out to them to resolve the issue."
            values={{ appSignals }}
            components={{ em: <em />, br: <br /> }}
          />
        </Text>
      }
      logoSrc="/images/info-bell.png"
      buttonLabel={t("Know more")}
      onButtonClick={() => {}}
      buttonVariant="outline"
      buttonIcon={<UilInfoCircle />}
    />
  )
}
