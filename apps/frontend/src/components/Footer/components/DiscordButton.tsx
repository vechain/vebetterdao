import { Button, Link, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaDiscord } from "react-icons/fa6"
import { AnalyticsUtils } from "@/utils"
import { buttonClickActions, ButtonClickProperties, buttonClicked, DISCORD_URL } from "@/constants"

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
