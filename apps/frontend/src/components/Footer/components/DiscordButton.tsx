import { Button, Link, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaDiscord } from "react-icons/fa6"

import { buttonClickActions, ButtonClickProperties, buttonClicked } from "../../../constants/AnalyticsEvents"
import { DISCORD_URL } from "../../../constants/links"
import AnalyticsUtils from "../../../utils/AnalyticsUtils/AnalyticsUtils"

type Props = {
  isFullWidth?: boolean
}
export const DiscordButton: React.FC<Props> = ({ isFullWidth }) => {
  const { t } = useTranslation()
  return (
    <Link
      href={DISCORD_URL}
      w={isFullWidth ? "full" : undefined}
      onClick={() => AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.JOIN_DISCORD))}>
      <Button variant="secondary" w={isFullWidth ? "full" : undefined}>
        <FaDiscord size={24} />
        <Text fontWeight="semibold" textStyle="md">
          {t("Join Discord Community")}
        </Text>
      </Button>
    </Link>
  )
}
