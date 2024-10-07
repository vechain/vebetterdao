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
import { useAcceptDelegation } from "@/hooks"

export const AcceptDelegationModal = ({ modal, delegator }: { modal: UseDisclosureProps; delegator: string }) => {
  const { t } = useTranslation()

  const acceptDelegation = useAcceptDelegation({})

  const handleDelegate = useCallback(() => {
    acceptDelegation.sendTransaction({ delegator })
  }, [acceptDelegation, delegator])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  if (acceptDelegation.status !== "ready") {
    return (
      <TransactionModal
        isOpen={modal.isOpen ?? false}
        onClose={modal.onClose ?? (() => {})}
        successTitle={t("Delegation accepted!")}
        status={acceptDelegation.status}
        errorDescription={acceptDelegation.error?.reason}
        errorTitle={acceptDelegation.error ? t("Error accepting delegation") : undefined}
        showTryAgainButton
        onTryAgain={() => acceptDelegation.sendTransaction({ delegator })}
        pendingTitle={t("Accepting delegation...")}
        showExplorerButton
        txId={acceptDelegation.txReceipt?.meta.txID ?? acceptDelegation.sendTransactionTx?.txid}
      />
    )
  }

  return (
    <BaseModal onClose={modal.onClose ?? (() => {})} isOpen={modal.isOpen ?? false}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to accept the Voting Qualification delegation?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="600">{t("You’re accepting it from")}</Text>
          <Text fontSize="sm">{delegator}</Text>
        </VStack>
        <Alert status="warning" borderRadius="2xl">
          <AlertIcon w={9} h={9} />
          <Box lineHeight={"1.20rem"} fontSize="sm">
            <AlertTitle as="span">{t("You will be able to vote using delegator's Voting Qualification")}</AlertTitle>
            <AlertDescription as="span">{t("once you have accepted the delegation.")}</AlertDescription>
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
