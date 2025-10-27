import { Heading, Text, UseDisclosureProps, VStack, Button, Box, Alert, useBreakpointValue } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"
import { useRemovePendingDelegationDelegatorPOV } from "@/hooks/useRemovePendingDelegationDelegatorPOV"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { ExclamationTriangle } from "../../../../../../../../../../components/Icons/ExclamationTriangle"

export const RemoveDelegationModal = ({ modal, delegatee }: { modal: UseDisclosureProps; delegatee: string }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { open: isOpen = false, onClose } = modal
  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])
  const removeDelegation = useRemovePendingDelegationDelegatorPOV({
    onSuccess: handleClose,
  })
  const handleDelegate = useCallback(() => {
    removeDelegation.sendTransaction()
  }, [removeDelegation])
  const triangleSize = useBreakpointValue({ base: 100, md: 220 })
  return (
    <BaseModal onClose={handleClose} isOpen={isOpen && !isTxModalOpen}>
      <VStack alignItems="stretch" gap={6}>
        <VStack justifyContent="center" alignItems="center" gap={10}>
          <ExclamationTriangle color="status.negative.primary" size={triangleSize} />
          <Heading size={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to remove the voting qualification request?")}
          </Heading>
        </VStack>
        <VStack alignItems="stretch">
          <Text fontWeight="semibold">{t("You're removing it to")}</Text>
          <Text textStyle="sm">{delegatee}</Text>
        </VStack>
        <Alert.Root status="error" borderRadius="2xl">
          <Alert.Indicator w={9} h={9} />
          <Box color="status.negative.primary" textStyle="sm">
            <Alert.Title as="span">
              {t("The delegatee won't be able to vote using your voting qualification")}
            </Alert.Title>
            <Alert.Description as="span">{t("once you have removed the delegation request.")}</Alert.Description>
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
