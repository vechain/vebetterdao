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
          <AlertTitle as="span">{t("Your Node can be currently used only by the manager")}</AlertTitle>
          <Text>
            {t(
              "You can't use your Node to endorse apps or to upgrade your Galaxy Member NFTs while it's delegated. Cancel the delegation to gain full control over your Node.",
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
        <AlertTitle as="span">{t("You have been added as a manager for this node")}</AlertTitle>
        <Text>{t("Only the owner can remove you as a manager.")}</Text>
      </Box>
    </Alert>
  )
}
