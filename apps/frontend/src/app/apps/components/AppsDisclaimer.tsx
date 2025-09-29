import { Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const AppsDisclaimer: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Text color="#6a6a6a" fontSize="sm" textAlign="left">
      {t(
        "VeBetter app listings are 100% community-driven. As a valued member of the VeBetter ecosystem, we encourage every eligible community member to carefully evaluate each app before using their endorsement points. Use your endorsement power responsibly to support apps that can drive the long-term growth and sustainability of our ecosystem. Stay alert and be cautious of potential scams. Together, we can build a stronger, more secure future for VeBetter.",
      )}
    </Text>
  )
}
