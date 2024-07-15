import { TELEGRAM_URL } from "@/constants"
import { Button, Link, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaTelegram } from "react-icons/fa6"

type Props = {
  isFullWidth?: boolean
}

export const TelegramButton: React.FC<Props> = ({ isFullWidth }) => {
  const { t } = useTranslation()
  return (
    <Link href={TELEGRAM_URL} isExternal w={isFullWidth ? "full" : undefined}>
      <Button
        leftIcon={<FaTelegram size={24} />}
        textColor={"white"}
        bgColor={`#27a6e7`}
        _hover={{ bg: "#0088cc" }}
        borderRadius={22}
        w={isFullWidth ? "full" : undefined}>
        <Text fontWeight={500} fontSize="16px" lineHeight="19px">
          {t("Join Telegram")}
        </Text>
      </Button>
    </Link>
  )
}
