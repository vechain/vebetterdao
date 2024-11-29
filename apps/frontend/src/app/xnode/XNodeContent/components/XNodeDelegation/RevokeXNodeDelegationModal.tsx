import { BaseModal } from "@/components/BaseModal"
import {
  Heading,
  UseDisclosureProps,
  VStack,
  Button,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useBreakpointValue,
  Text,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { ExclamationTriangle, TransactionModal } from "@/components"
import { useRevokeXNodeDelegation } from "@/hooks"
import { useXNode } from "@/api"

export const RevokeXNodeDelegationModal = ({ modal }: { modal: UseDisclosureProps }) => {
  const { t } = useTranslation()
  const { isXNodeAttachedToGM } = useXNode()

  const revokeXNodeDelegation = useRevokeXNodeDelegation({})

  const handleRevoke = useCallback(() => {
    revokeXNodeDelegation.sendTransaction({ isAttachedToGM: isXNodeAttachedToGM })
  }, [revokeXNodeDelegation, isXNodeAttachedToGM])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  const handleClose = useCallback(() => {
    modal.onClose?.()
    revokeXNodeDelegation.resetStatus()
  }, [modal, revokeXNodeDelegation])

  if (revokeXNodeDelegation.status !== "ready") {
    return (
      <TransactionModal
        isOpen={modal.isOpen ?? false}
        onClose={handleClose}
        successTitle={t("Node delegation revoked!")}
        status={revokeXNodeDelegation.status}
        errorDescription={revokeXNodeDelegation.error?.reason}
        errorTitle={revokeXNodeDelegation.error ? t("Error revoking Node delegation") : undefined}
        showTryAgainButton
        onTryAgain={() => revokeXNodeDelegation.sendTransaction({ isAttachedToGM: isXNodeAttachedToGM })}
        pendingTitle={t("Revoking Node delegation...")}
        showExplorerButton
        txId={revokeXNodeDelegation.txReceipt?.meta.txID ?? revokeXNodeDelegation.sendTransactionTx?.txid}
      />
    )
  }

  return (
    <BaseModal onClose={handleClose} isOpen={modal.isOpen ?? false}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to revoke your Node delegation?")}
          </Heading>
        </VStack>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon w={9} h={9} />
          <Box lineHeight={"1.20rem"} color="#C84968" fontSize="sm">
            <AlertTitle as="span">
              {t("The delegated address will no longer be able to endorse and upgrade GM NFTs using your Node")}
            </AlertTitle>
            <AlertDescription as="span">{t("once you have revoked the delegation.")}</AlertDescription>
            {isXNodeAttachedToGM && (
              <Text mt={2} fontSize="sm" color="#C84968" fontWeight={600}>
                {t("Notice: the GM NFT attached to this Node will be detached and will lose the free levels.")}
              </Text>
            )}
          </Box>
        </Alert>
        <VStack>
          <Button variant="primaryAction" onClick={handleRevoke}>
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
