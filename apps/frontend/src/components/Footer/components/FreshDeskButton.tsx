import { Button, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaQuestionCircle } from "react-icons/fa"

import { buttonClickActions, ButtonClickProperties, buttonClicked } from "../../../constants/AnalyticsEvents"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"

type Props = {
  isFullWidth?: boolean
}
export const FreshDeskButton: React.FC<Props> = ({ isFullWidth }) => {
  const { t } = useTranslation()
  const openFreshdeskWidget = () => {
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.HELP))
    const browserWindow = window as Window &
      typeof globalThis & {
        // eslint-disable-next-line no-unused-vars
        FreshworksWidget: (command: string, ...args: any[]) => void
      }
    if (browserWindow.FreshworksWidget) {
      browserWindow.FreshworksWidget("open")
    }
  }
  return (
    <Button onClick={openFreshdeskWidget} variant="secondary" w={isFullWidth ? "full" : undefined}>
      <FaQuestionCircle size={24} />
      <Text fontWeight="semibold" textStyle="md">
        {t("Help")}
      </Text>
    </Button>
  )
}
