import { useTranslation } from "react-i18next"
import { useWallet } from "@vechain/dapp-kit-react"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useUserSignalEvents } from "@/api/contracts/xApps/hooks/useUserSignalEvents"
import { useXApps } from "@/api"

export const UserSignaledBanner = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userSignals } = useUserSignalEvents(account ?? "")
  const { data: apps } = useXApps()

  const getAppDetails = (appId: string) => apps?.allApps.find(app => app.id === appId)

  const signals =
    userSignals?.reduce((acc, signal) => {
      const app = getAppDetails(signal.appId)
      if (!app) return acc
      if (!acc.has(app?.name)) {
        acc.set(app?.name, new Set<string>(signal?.reason))
      }
      if (signal.reason) {
        acc.get(app?.name)!.add(signal.reason)
      }
      return acc
    }, new Map<string, Set<string>>()) ?? new Map()

  const appSignalsText = Array.from(signals.entries())
    .map(([app]) => `${app} (TODO)`)
    .join("; ")

  return (
    <GenericBanner
      title={t("YOU HAVE BEEN SIGNALED")}
      titleColor="#8D6602"
      description={t(
        "You have been signaled by the following apps: {{appSignals}}. Please get in touch with them to sort it out.",
        { appSignals: appSignalsText },
      )}
      descriptionColor="#5F4400"
      logoSrc="/images/info-bell.png"
      backgroundColor="#FFD979"
      backgroundImageSrc="/images/cloud-background-orange.png"
    />
  )
}
