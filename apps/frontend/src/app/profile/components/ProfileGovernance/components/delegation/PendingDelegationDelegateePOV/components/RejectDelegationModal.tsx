import { BaseModal } from "@/components/BaseModal"
import {
  Heading,
  Text,
  UseDisclosureProps,
  VStack,
  Button,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { ExclamationTriangle } from "@/components"
import { useRemovePendingDelegationDelegateePOV } from "@/hooks/useRemovePendingDelegationDelegateePOV"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
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
    <BaseModal onClose={handleClose} isOpen={(modal.isOpen && !isTxModalOpen) ?? false}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to reject the Voting Qualification delegation?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="600">{t("You’re rejecting it from")}</Text>
          <Text fontSize="sm">{delegator}</Text>
        </VStack>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon w={9} h={9} />
          <Box lineHeight={"1.20rem"} color="#C84968" fontSize="sm">
            <AlertTitle as="span">
              {t("You will not be able to vote using delegator's Voting Qualification")}
            </AlertTitle>
            <AlertDescription as="span">{t("once you have rejected the delegation.")}</AlertDescription>
          </Box>
        </Alert>
        <VStack>
          <Button variant="primaryAction" onClick={handleDelegate}>
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
