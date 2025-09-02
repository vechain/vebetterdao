import { Alert } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const DelegationAlert = ({
  isXNodeDelegator,
  isXNodeDelegated,
}: {
  isXNodeDelegator: boolean
  isXNodeDelegated: boolean
}) => {
  const { t } = useTranslation()

  if (!isXNodeDelegated) {
    return null
  }

  if (isXNodeDelegator) {
    return (
      <Alert.Root status="warning" borderRadius="2xl">
        <Alert.Indicator />
        <Alert.Content textStyle="sm">
          <Alert.Title as="span">{t("Your Node can be currently used only by the manager")}</Alert.Title>
          <Alert.Description>
            {t(
              "You can't use your Node to endorse apps or to upgrade your Galaxy Member NFTs while it's delegated. Cancel the delegation to gain full control over your Node.",
            )}
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
    )
  }

  return (
    <Alert.Root status="info" borderRadius="2xl">
      <Alert.Indicator />
      <Alert.Content textStyle="sm">
        <Alert.Title as="span">{t("You have been added as a manager for this node")}</Alert.Title>
        <Alert.Description>{t("Only the owner can remove you as a manager.")}</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  )
}
