import { BaseModal } from "@/components/BaseModal"
import { Heading, UseDisclosureProps, VStack, Button, Box, Alert, useBreakpointValue, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { ExclamationTriangle } from "@/components"
import { useRevokeXNodeDelegation } from "@/hooks"
import { UserNode } from "@/api"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

export const RevokeXNodeDelegationModal = ({ xNode, modal }: { xNode: UserNode; modal: UseDisclosureProps }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { open = false, onClose } = modal
  const isXNodeAttachedToGM = !!xNode?.gmTokenIdAttachedToNode

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const revokeXNodeDelegation = useRevokeXNodeDelegation({ xNode, onSuccess: handleClose })
  const handleRevoke = useCallback(() => {
    revokeXNodeDelegation.sendTransaction({ isAttachedToGM: isXNodeAttachedToGM })
  }, [revokeXNodeDelegation, isXNodeAttachedToGM])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  return (
    <BaseModal onClose={handleClose} isOpen={open && !isTxModalOpen}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="status.negative.primary" size={triangleSize} />
          <Heading size={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to revoke your Node delegation?")}
          </Heading>
        </VStack>
        <Alert.Root status="error" borderRadius="2xl">
          <Alert.Indicator />
          <Box color="status.negative.primary" textStyle="sm">
            <Alert.Title as="span">
              {t("The delegated address will no longer be able to endorse and upgrade GM NFTs using your Node")}
            </Alert.Title>
            <Alert.Description as="span">{t("once you have revoked the delegation.")}</Alert.Description>
            {isXNodeAttachedToGM && (
              <Text mt={2} textStyle="sm" color="status.negative.primary" fontWeight="semibold">
                {t("Notice: the GM NFT attached to this Node will be detached and will lose the free levels.")}
              </Text>
            )}
          </Box>
        </Alert.Root>
        <VStack>
          <Button variant="primary" onClick={handleRevoke}>
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
