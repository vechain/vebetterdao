import { Alert, AlertIcon, Box, AlertTitle, Text } from "@chakra-ui/react"
import { useXNode } from "@/api"
import { useTranslation } from "react-i18next"

export const DelegationAlert = () => {
  const { t } = useTranslation()
  const { isXNodeDelegator, isXNodeDelegated } = useXNode()

  if (!isXNodeDelegated) {
    return null
  }

  if (isXNodeDelegator) {
    return (
      <Alert status="warning" borderRadius="2xl">
        <AlertIcon />
        <Box lineHeight="1.20rem" fontSize="sm">
          <AlertTitle as="span">{t("Your Node is currently delegated to another address")}</AlertTitle>
          <Text>
            {t(
              "You can't endorse apps with this account if you delegated your Node. Cancel the delegation to be able to endorse apps with this account again.",
            )}
          </Text>
        </Box>
      </Alert>
    )
  }

  return (
    <Alert status="info" borderRadius="2xl">
      <AlertIcon />
      <Box lineHeight="1.20rem" fontSize="sm">
        <AlertTitle as="span">{t("You are controlling a delegated Node")}</AlertTitle>
        <Text>{t("Only the Node owner can revoke the delegation.")}</Text>
      </Box>
    </Alert>
  )
}
