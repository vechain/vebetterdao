import { Alert, AlertDescription, Box } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export function AppealWarning({ isVerified }: { isVerified: boolean }) {
  const { t } = useTranslation()

  return (
    <Alert status="warning" borderRadius="16px" bg="#FFF3E5">
      <Box>
        <AlertDescription>
          {t(
            isVerified
              ? "You have already completed the verification. Please click the button below to appeal."
              : "You must complete the verification using the same wallet address that was flagged. Verification with a different wallet will not lift the restrictions on your flagged wallet.",
          )}
        </AlertDescription>
      </Box>
    </Alert>
  )
}
