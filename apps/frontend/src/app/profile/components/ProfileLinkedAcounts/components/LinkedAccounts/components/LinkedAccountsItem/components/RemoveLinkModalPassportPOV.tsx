import { BaseModal } from "@/components/BaseModal"
import { Heading, Text, UseDisclosureProps, VStack, Button, Box, Alert, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { ExclamationTriangle } from "@/components"
import { useRemoveEntityLink } from "@/hooks"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

export const RemoveLinkModalPassportPOV = ({ modal, entity }: { modal: UseDisclosureProps; entity: string }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { open: isOpen = false, onClose } = modal

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const removeLinking = useRemoveEntityLink({
    onSuccess: handleClose,
  })

  const handleRemoveLink = useCallback(() => {
    removeLinking.sendTransaction({ entity })
  }, [removeLinking, entity])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  return (
    <BaseModal onClose={handleClose} isOpen={isOpen && !isTxModalOpen}>
      <VStack alignItems="stretch" gap={6}>
        <VStack justifyContent="center" alignItems="center" gap={10}>
          <ExclamationTriangle color="status.negative.primary" size={triangleSize} />
          <Heading size={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to remove the linking?")}
          </Heading>
        </VStack>
        <VStack alignItems="stretch">
          <Text fontWeight="semibold">{t("You’re removing it from")}</Text>
          <Text textStyle="sm">{entity}</Text>
        </VStack>
        <Alert.Root status="error" borderRadius="2xl">
          <Alert.Indicator w={9} h={9} />
          <Box color="status.negative.primary" textStyle="sm">
            <Alert.Title as="span">{t("You will not able to use the actions performed in this address.")}</Alert.Title>
            <Alert.Description as="span">{t("once you have removed the linking.")}</Alert.Description>
          </Box>
        </Alert.Root>
        <VStack>
          <Button variant="primary" onClick={handleRemoveLink}>
            {t("Yes, I'm sure")}
          </Button>
          <Button variant="ghost" color="actions.tertiary.default" onClick={handleClose}>
            {t("No, go back")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
