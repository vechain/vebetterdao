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
import { ExclamationTriangle, TransactionModal, TransactionModalStatus } from "@/components"
import { useRejectEntityLink } from "@/hooks"

export const RejectLinkingModal = ({
  modal,
  secondaryAccount,
}: {
  modal: UseDisclosureProps
  secondaryAccount: string
}) => {
  const { t } = useTranslation()

  const rejectLinking = useRejectEntityLink({})

  const handleDelegate = useCallback(() => {
    rejectLinking.sendTransaction({ entity: secondaryAccount })
  }, [rejectLinking, secondaryAccount])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  const handleClose = useCallback(() => {
    modal.onClose?.()
    rejectLinking.resetStatus()
  }, [modal, rejectLinking])

  if (rejectLinking.status !== "ready") {
    return (
      <TransactionModal
        isOpen={modal.isOpen ?? false}
        onClose={handleClose}
        status={rejectLinking.status as TransactionModalStatus}
        errorDescription={rejectLinking.error?.reason}
        onTryAgain={() => rejectLinking.sendTransaction({ entity: secondaryAccount })}
        titles={{
          [TransactionModalStatus.Success]: t("Linking rejected!"),
          [TransactionModalStatus.Error]: t("Error rejecting linking"),
          [TransactionModalStatus.Pending]: t("Rejecting linking..."),
        }}
        txId={rejectLinking.txReceipt?.meta.txID}
      />
    )
  }

  return (
    <BaseModal onClose={handleClose} isOpen={modal.isOpen ?? false}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to reject the linking proposal?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="600">{t("You’re rejecting it from")}</Text>
          <Text fontSize="sm">{secondaryAccount}</Text>
        </VStack>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon w={9} h={9} />
          <Box lineHeight={"1.20rem"} color="#C84968" fontSize="sm">
            <AlertTitle as="span">{t("You will not able to use the actions performed in this address.")}</AlertTitle>
            <AlertDescription as="span">{t("once you have rejected the linking proposal.")}</AlertDescription>
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
