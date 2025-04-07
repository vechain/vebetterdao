import { Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export function AppealDesc({ isVerified }: { isVerified: boolean }) {
  const { t } = useTranslation()

  return (
    <Text color="black" fontSize="md" fontWeight={400}>
      {t(
        isVerified
          ? "Your wallet has been flagged again for bot-like behavior."
          : "Your wallet has been flagged for bot-like behavior. To lift the restriction, please complete the KYC verification process.",
      )}
    </Text>
  )
}
