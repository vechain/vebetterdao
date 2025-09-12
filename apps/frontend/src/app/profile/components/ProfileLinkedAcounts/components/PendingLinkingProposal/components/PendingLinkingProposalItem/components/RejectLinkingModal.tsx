import { BaseModal } from "@/components/BaseModal"
import { Heading, Text, UseDisclosureProps, VStack, Button, Box, Alert, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { ExclamationTriangle } from "@/components"
import { useRejectEntityLink } from "@/hooks"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

export const RejectLinkingModal = ({
  modal,
  secondaryAccount,
}: {
  modal: UseDisclosureProps
  secondaryAccount: string
}) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const rejectLinking = useRejectEntityLink({})

  const handleDelegate = useCallback(() => {
    rejectLinking.sendTransaction({ entity: secondaryAccount })
  }, [rejectLinking, secondaryAccount])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  const handleClose = useCallback(() => {
    modal.onClose?.()
    rejectLinking.resetStatus()
  }, [modal, rejectLinking])

  return (
    <BaseModal onClose={handleClose} isOpen={(modal.open && !isTxModalOpen) ?? false}>
      <VStack alignItems="stretch" gap={6}>
        <VStack justifyContent="center" alignItems="center" gap={10}>
          <ExclamationTriangle color="error.primary" size={triangleSize} />
          <Heading size={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to reject the linking proposal?")}
          </Heading>
        </VStack>
        <VStack alignItems="stretch">
          <Text fontWeight="semibold">{t("You’re rejecting it from")}</Text>
          <Text textStyle="sm">{secondaryAccount}</Text>
        </VStack>
        <Alert.Root status="error" borderRadius="2xl">
          <Alert.Indicator w={9} h={9} />
          <Box color="error.primary" textStyle="sm">
            <Alert.Title as="span">{t("You will not able to use the actions performed in this address.")}</Alert.Title>
            <Alert.Description as="span">{t("once you have rejected the linking proposal.")}</Alert.Description>
          </Box>
        </Alert.Root>
        <VStack>
          <Button variant="primary" onClick={handleDelegate}>
            {t("Yes, I'm sure")}
          </Button>
          <Button variant={"primaryGhost"} onClick={handleClose}>
            {t("No, go back")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
