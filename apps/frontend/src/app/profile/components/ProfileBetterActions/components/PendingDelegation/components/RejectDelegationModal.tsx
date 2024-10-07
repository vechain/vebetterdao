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
import { ExclamationTriangle, TransactionModal } from "@/components"
import { useRemovePendingDelegation } from "@/hooks"

export const RejectDelegationModal = ({ modal, delegator }: { modal: UseDisclosureProps; delegator: string }) => {
  const { t } = useTranslation()

  const rejectDelegation = useRemovePendingDelegation({})

  const handleDelegate = useCallback(() => {
    rejectDelegation.sendTransaction({ delegator })
  }, [rejectDelegation, delegator])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  if (rejectDelegation.status !== "ready") {
    return (
      <TransactionModal
        isOpen={modal.isOpen ?? false}
        onClose={modal.onClose ?? (() => {})}
        successTitle={t("Delegation rejected!")}
        status={rejectDelegation.status}
        errorDescription={rejectDelegation.error?.reason}
        errorTitle={rejectDelegation.error ? t("Error rejecting delegation") : undefined}
        showTryAgainButton
        onTryAgain={() => rejectDelegation.sendTransaction({ delegator })}
        pendingTitle={t("Rejecting delegation...")}
        showExplorerButton
        txId={rejectDelegation.txReceipt?.meta.txID ?? rejectDelegation.sendTransactionTx?.txid}
      />
    )
  }

  return (
    <BaseModal onClose={modal.onClose ?? (() => {})} isOpen={modal.isOpen ?? false}>
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
          <Button variant={"primaryGhost"} onClick={modal.onClose}>
            {t("No, go back")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
