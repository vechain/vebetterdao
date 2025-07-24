import { Alert, Box, AlertTitle, Text, Button, useDisclosure } from "@chakra-ui/react"
import { useXNode } from "@/api"
import { useTranslation } from "react-i18next"
import { MultipleXNodesInfoModal } from "./MultipleXNodesInfoModal"

export const MultipleXNodesAlert = () => {
  const { t } = useTranslation()
  const { allNodes } = useXNode()
  const infoModal = useDisclosure()

  if (!allNodes.length || allNodes.length === 1) {
    return null
  }

  return (
    <>
      <Alert.Root status="error" borderRadius="2xl">
        <Alert.Indicator />
        <Box lineHeight="1.20rem" fontSize="sm" flex={1}>
          <AlertTitle as="span">{t("You are controlling multiple Nodes")}</AlertTitle>
          <Text>
            {t(
              "We currently support only one Node per account. Please cancel the delegation of the other Nodes to use your preferred one.",
            )}
          </Text>
        </Box>
        <Button variant="ghost" size="sm" onClick={infoModal.onOpen} color="#C84968">
          {t("View Details")}
        </Button>
      </Alert.Root>
      <MultipleXNodesInfoModal modal={infoModal} />
    </>
  )
}
