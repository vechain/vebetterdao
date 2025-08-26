import { BaseModal } from "@/components/BaseModal"
import { Heading, Text, UseDisclosureProps, VStack, Button, Box, Alert, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { ExclamationTriangle } from "@/components"
import { useRemoveLinkingRequestToPassport } from "@/hooks"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

export const RemovePendingRequestModal = ({ modal, passport }: { modal: UseDisclosureProps; passport: string }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const removeLinkingRequest = useRemoveLinkingRequestToPassport({})

  const handleRemoveLink = useCallback(() => {
    removeLinkingRequest.sendTransaction()
  }, [removeLinkingRequest])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  const handleClose = useCallback(() => {
    modal.onClose?.()
    removeLinkingRequest.resetStatus()
  }, [modal, removeLinkingRequest])

  return (
    <BaseModal onClose={handleClose} isOpen={(modal.open && !isTxModalOpen) ?? false}>
      <VStack alignItems="stretch" gap={6}>
        <VStack justifyContent="center" alignItems="center" gap={10}>
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to remove the pending request?")}
          </Heading>
        </VStack>
        <VStack alignItems="stretch">
          <Text fontWeight="600">{t("You’re removing it from")}</Text>
          <Text fontSize="sm">{passport}</Text>
        </VStack>
        <Alert.Root status="error" borderRadius="2xl">
          <Alert.Indicator w={9} h={9} />
          <Box lineHeight={"1.20rem"} color="#C84968" fontSize="sm">
            <Alert.Title as="span">
              {t("Passport will not able to use the actions performed in this address.")}
            </Alert.Title>
            <Alert.Description as="span">{t("once you have removed the pending request.")}</Alert.Description>
          </Box>
        </Alert.Root>
        <VStack>
          <Button variant="primaryAction" onClick={handleRemoveLink}>
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
