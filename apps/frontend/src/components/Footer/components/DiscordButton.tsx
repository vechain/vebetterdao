import { DISCORD_URL } from "@/constants"
import { Button, Link, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaDiscord } from "react-icons/fa6"

export const DiscordButton: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Link href={DISCORD_URL} isExternal>
      <Button
        leftIcon={<FaDiscord size={24} />}
        textColor={"white"}
        bgColor={`#5865f2`}
        _hover={{ bg: "#3f4b9c" }}
        borderRadius={22}>
        <Text fontWeight={500} fontSize="16px" lineHeight="19px">
          {t("Join Discord Community")}
        </Text>
      </Button>
    </Link>
  )
}
