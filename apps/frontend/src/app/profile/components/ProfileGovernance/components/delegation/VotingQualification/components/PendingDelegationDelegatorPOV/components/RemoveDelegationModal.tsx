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
import { useRemovePendingDelegationDelegatorPOV } from "@/hooks/useRemovePendingDelegationDelegatorPOV"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
export const RemoveDelegationModal = ({ modal, delegatee }: { modal: UseDisclosureProps; delegatee: string }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { isOpen = false, onClose } = modal

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
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to remove the voting qualification request?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="600">{t("You're removing it to")}</Text>
          <Text fontSize="sm">{delegatee}</Text>
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
