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

export const RemoveDelegationModal = ({ modal, delegator }: { modal: UseDisclosureProps; delegator: string }) => {
  const { t } = useTranslation()

  const removeDelegation = useRemovePendingDelegation({})

  const handleDelegate = useCallback(() => {
    removeDelegation.sendTransaction({ delegator })
  }, [removeDelegation, delegator])

  const handleClose = useCallback(() => {
    modal.onClose?.()
    removeDelegation.resetStatus()
  }, [modal, removeDelegation])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  if (removeDelegation.status !== "ready") {
    return (
      <TransactionModal
        isOpen={modal.isOpen ?? false}
        onClose={handleClose}
        successTitle={t("Delegation request removed!")}
        status={removeDelegation.status}
        errorDescription={removeDelegation.error?.reason}
        errorTitle={removeDelegation.error ? t("Error removing delegation request") : undefined}
        showTryAgainButton
        onTryAgain={() => removeDelegation.sendTransaction({ delegator })}
        pendingTitle={t("Removing delegation request...")}
        showExplorerButton
        txId={removeDelegation.txReceipt?.meta.txID ?? removeDelegation.sendTransactionTx?.txid}
      />
    )
  }

  return (
    <BaseModal onClose={handleClose} isOpen={modal.isOpen ?? false}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to remove the voting qualification request?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="600">{t("You're removing it to")}</Text>
          <Text fontSize="sm">{delegator}</Text>
        </VStack>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon w={9} h={9} />
          <Box lineHeight={"1.20rem"} color="#C84968" fontSize="sm">
            <AlertTitle as="span">
              {t("The delegatee won't be able to vote using your voting qualification")}
            </AlertTitle>
            <AlertDescription as="span">{t("once you have removed the delegation request.")}</AlertDescription>
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
