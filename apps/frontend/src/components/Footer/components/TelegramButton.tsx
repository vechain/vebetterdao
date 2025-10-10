import { Button, Link, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaTelegram } from "react-icons/fa6"

import { buttonClickActions, ButtonClickProperties, buttonClicked } from "../../../constants/AnalyticsEvents"
import { TELEGRAM_URL } from "../../../constants/links"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"

type Props = {
  isFullWidth?: boolean
}
export const TelegramButton: React.FC<Props> = ({ isFullWidth }) => {
  const { t } = useTranslation()
  return (
    <Link
      href={TELEGRAM_URL}
      w={isFullWidth ? "full" : undefined}
      onClick={() => AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_TELEGRAM))}>
      <Button variant="secondary" w={isFullWidth ? "full" : undefined}>
        <FaTelegram size={24} />
        <Text fontWeight="semibold" textStyle="md">
          {t("Join Telegram")}
        </Text>
      </Button>
    </Link>
  )
}
