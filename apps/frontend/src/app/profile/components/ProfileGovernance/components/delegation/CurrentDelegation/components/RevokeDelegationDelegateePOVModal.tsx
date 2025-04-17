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
import { useRevokeDelegation } from "@/hooks"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
export const RevokeDelegationDelegateePOVModal = ({
  modal,
  delegator,
}: {
  modal: UseDisclosureProps
  delegator: string
}) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const revokeDelegation = useRevokeDelegation({ isDelegator: false })

  const handleDelegate = useCallback(() => {
    revokeDelegation.sendTransaction()
  }, [revokeDelegation])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  const handleClose = useCallback(() => {
    modal.onClose?.()
    revokeDelegation.resetStatus()
  }, [modal, revokeDelegation])

  return (
    <BaseModal onClose={handleClose} isOpen={(modal.isOpen && !isTxModalOpen) ?? false}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to remove the Voting Qualification delegation you're using?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="600">{t("You're removing the delegation from")}</Text>
          <Text fontSize="sm">{delegator}</Text>
        </VStack>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon w={9} h={9} />
          <Box lineHeight={"1.20rem"} color="#C84968" fontSize="sm">
            <AlertTitle as="span">
              {t("You won’t be able to vote using the delegator's Voting Qualification")}
            </AlertTitle>
            <AlertDescription as="span">{t("once you have removed the delegation.")}</AlertDescription>
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
