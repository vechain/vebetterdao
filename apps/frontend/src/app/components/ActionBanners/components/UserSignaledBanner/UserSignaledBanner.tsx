import { Trans, useTranslation } from "react-i18next"
import { useWallet } from "@vechain/vechain-kit"
import { GenericBanner } from "@/app/components/Banners/GenericBanner"
import { useUserSignalEvents, useXApps } from "@/api"
import { Text, useDisclosure } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { SignalModal } from "./components/SignalModal"

export const UserSignaledBanner = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const {
    data: { activeSignalEvents },
  } = useUserSignalEvents(account?.address ?? "")
  const { data: apps } = useXApps()

  const { open: isOpen, onOpen, onClose } = useDisclosure()

  const allApps = apps?.allApps ?? []
  const signals = activeSignalEvents || []

  function getAppName(appId: string): string {
    const found = allApps.find(app => app.id === appId)
    return found ? found.name : "Unknown"
  }
  const enrichedSignals = signals.map(signal => ({
    ...signal,
    appName: getAppName(signal.appId),
  }))

  const appNames = [...new Set(enrichedSignals.map(({ appName }) => appName))]

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
    <>
      <GenericBanner
        title={t("You have been signalled").toUpperCase()}
        titleColor="#8D6602"
        description={
          <>
            <Text textStyle="lg" fontWeight="700" color="#5F4400">
              <Trans
                as="span"
                i18nKey="You have been signalled by <em>{{appSignals}}</em>."
                values={{ appSignals }}
                components={{ em: <em />, br: <br /> }}
              />
            </Text>
            <Text textStyle="lg" fontWeight="700" color="#5F4400">
              {t(
                "If you believe this signal is unfair, please reach out to the app that signalled you to resolve the issue.",
              )}
            </Text>
          </>
        }
        logoSrc="/assets/icons/info-bell.webp"
        backgroundColor="#FFD979"
        backgroundImageSrc="/assets/backgrounds/cloud-background-orange.webp"
        buttonLabel={t("Appeal here")}
        onButtonClick={onOpen}
        buttonVariant="outline"
        buttonIcon={<UilInfoCircle />}
      />
      <SignalModal open={isOpen} onClose={onClose} signals={enrichedSignals} />
    </>
  )
}
