import { buttonClickActions, ButtonClickProperties, buttonClicked, TELEGRAM_URL } from "@/constants"
import { AnalyticsUtils } from "@/utils"
import { Button, Link, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaTelegram } from "react-icons/fa6"

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
      <Button
        color={"white"}
        bgColor={`#27a6e7`}
        _hover={{ bg: "#0088cc" }}
        borderRadius={22}
        w={isFullWidth ? "full" : undefined}>
        <FaTelegram size={24} />
        <Text fontWeight="semibold" textStyle="md">
          {t("Join Telegram")}
        </Text>
      </Button>
    </Link>
  )
}
