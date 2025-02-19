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

  const allApps = apps?.allApps ?? []
  const signals = userSignals || []

  function getAppName(appId: string): string {
    const found = allApps.find(app => app.id === appId)
    return found ? found.name : "Unknown"
  }

  const appNames = [...new Set(signals.map(({ appId }) => getAppName(appId)))]

  function formatAppNames(names: string[]): string {
    const MAX_LENGTH = 40
    const joined = names.join(", ")

    if (names.length > 3 || joined.length > MAX_LENGTH) {
      return "many apps"
    }
    if (names.length === 2) {
      return names.join(" and ")
    }
    if (names.length > 2) {
      const lastName = names[names.length - 1]
      const rest = names.slice(0, -1).join(", ")
      return `${rest} and ${lastName}`
    }

    return joined
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
