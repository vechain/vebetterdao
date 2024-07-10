import { Button, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaQuestionCircle } from "react-icons/fa"

export const FreshDeskButton: React.FC = () => {
  const { t } = useTranslation()
  const openFreshdeskWidget = () => {
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
      leftIcon={<FaQuestionCircle size={24} />}
      textColor={"white"}
      bgColor={`#006063`}
      _hover={{ bg: "#004143" }}
      borderRadius={22}>
      <Text fontWeight={500} fontSize="16px" lineHeight="19px">
        {t("Help")}
      </Text>
    </Button>
  )
}
