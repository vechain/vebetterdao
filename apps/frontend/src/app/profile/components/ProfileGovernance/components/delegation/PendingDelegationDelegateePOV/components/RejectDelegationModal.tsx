import { Heading, Text, UseDisclosureProps, VStack, Button, Box, Alert, useBreakpointValue } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"
import { useRemovePendingDelegationDelegateePOV } from "@/hooks/useRemovePendingDelegationDelegateePOV"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { ExclamationTriangle } from "../../../../../../../../components/Icons/ExclamationTriangle"

export const RejectDelegationModal = ({ modal, delegator }: { modal: UseDisclosureProps; delegator: string }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const rejectDelegation = useRemovePendingDelegationDelegateePOV({})
  const handleDelegate = useCallback(() => {
    rejectDelegation.sendTransaction({ delegator })
  }, [rejectDelegation, delegator])
  const triangleSize = useBreakpointValue({ base: 100, md: 220 })
  const handleClose = useCallback(() => {
    modal.onClose?.()
    rejectDelegation.resetStatus()
  }, [modal, rejectDelegation])
  return (
    <BaseModal onClose={handleClose} isOpen={(modal.open && !isTxModalOpen) ?? false}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="status.negative.primary" size={triangleSize} />
          <Heading size={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to reject the Voting Qualification delegation?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="semibold">{t("You’re rejecting it from")}</Text>
          <Text textStyle="sm">{delegator}</Text>
        </VStack>
        <Alert.Root status="error" borderRadius="2xl">
          <Alert.Indicator w={9} h={9} />
          <Box color="status.negative.primary" textStyle="sm">
            <Alert.Title as="span">
              {t("You will not be able to vote using delegator's Voting Qualification")}
            </Alert.Title>
            <Alert.Description as="span">{t("once you have rejected the delegation.")}</Alert.Description>
          </Box>
        </Alert.Root>
        <VStack>
          <Button variant="primary" onClick={handleDelegate}>
            {t("Yes, I'm sure")}
          </Button>
          <Button variant="link" onClick={handleClose}>
            {t("No, go back")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
