import { Text, useDisclosure, Button, Icon } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { GenericBanner } from "@/app/components/Banners/GenericBanner"

import { useUserSignalEvents } from "../../../../../api/contracts/xApps/hooks/useUserSignalEvents"
import { useXApps } from "../../../../../api/contracts/xApps/hooks/useXApps"

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
        variant="info"
        title={t("You have been signalled").toUpperCase()}
        description={
          <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold">
            {t("You have been signalled by")} <b>{appSignals}</b>
            {<br />}
            {t(
              "If you believe this signal is unfair, please reach out to the app that signalled you to resolve the issue.",
            )}
          </Text>
        }
        illustration="/assets/icons/info-bell.webp"
        cta={
          <Button variant="secondary" onClick={onOpen}>
            {t("Appeal here")}
            <Icon as={UilInfoCircle} color="white" />
          </Button>
        }
      />
      <SignalModal open={isOpen} onClose={onClose} signals={enrichedSignals} />
    </>
  )
}
