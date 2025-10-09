import { Heading, Text, UseDisclosureProps, VStack, Button, Box, Alert, useBreakpointValue } from "@chakra-ui/react"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useAcceptDelegation } from "../../../../../../../../hooks/useAcceptDelegation"
import { ExclamationTriangle } from "../../../../../../../../components/Icons/ExclamationTriangle"

import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { BaseModal } from "@/components/BaseModal"

export const AcceptDelegationModal = ({ modal, delegator }: { modal: UseDisclosureProps; delegator: string }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { data: vnsData } = useVechainDomain(delegator ?? "")
  const delegatorName = vnsData?.domain
  const acceptDelegation = useAcceptDelegation({})
  const handleDelegate = useCallback(() => {
    acceptDelegation.sendTransaction({ delegator })
  }, [acceptDelegation, delegator])
  const triangleSize = useBreakpointValue({ base: 100, md: 220 })
  const handleClose = useCallback(() => {
    modal.onClose?.()
    acceptDelegation.resetStatus()
  }, [modal, acceptDelegation])
  return (
    <BaseModal onClose={handleClose} isOpen={(modal.open && !isTxModalOpen) ?? false}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle size={triangleSize} />
          <Heading size={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to accept the Voting Qualification delegation?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="semibold">{t("You’re accepting it from")}</Text>
          <Text textStyle="sm">{delegatorName}</Text>
          <Text textStyle="sm">{delegator}</Text>
        </VStack>
        <Alert.Root status="warning" borderRadius="2xl">
          <Alert.Indicator w={9} h={9} />
          <Box textStyle="sm">
            <Alert.Title as="span">{t("You will be able to vote using delegator's Voting Qualification")}</Alert.Title>
            <Alert.Description as="span">{t("once you have accepted the delegation.")}</Alert.Description>
          </Box>
        </Alert.Root>
        <VStack>
          <Button variant="primary" onClick={handleDelegate}>
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
