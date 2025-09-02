import { buttonClickActions, ButtonClickProperties, buttonClicked } from "@/constants"
import { AnalyticsUtils } from "@/utils"
import { Button, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaQuestionCircle } from "react-icons/fa"

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
    <Button
      onClick={openFreshdeskWidget}
      color={"white"}
      bgColor={`#006063`}
      _hover={{ bg: "#004143" }}
      borderRadius={22}
      w={isFullWidth ? "full" : undefined}>
      <FaQuestionCircle size={24} />
      <Text fontWeight="semibold" textStyle="md">
        {t("Help")}
      </Text>
    </Button>
  )
}
