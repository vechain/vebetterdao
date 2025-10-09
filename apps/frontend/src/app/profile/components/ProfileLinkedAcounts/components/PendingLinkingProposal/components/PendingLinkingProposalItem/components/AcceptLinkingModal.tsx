import { BaseModal } from "@/components/BaseModal"
import { Heading, Text, UseDisclosureProps, VStack, Button, Box, Alert, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { ExclamationTriangle } from "@/components"
import { useAcceptEntityLink } from "@/hooks"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

export const AcceptLinkingModal = ({
  modal,
  secondaryAccount,
}: {
  modal: UseDisclosureProps
  secondaryAccount: string
}) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { data: vnsData } = useVechainDomain(secondaryAccount || "")
  const domain = vnsData?.domain

  const acceptLinking = useAcceptEntityLink({})

  const handleDelegate = useCallback(() => {
    acceptLinking.sendTransaction({ entity: secondaryAccount })
  }, [acceptLinking, secondaryAccount])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  const handleClose = useCallback(() => {
    modal.onClose?.()
    acceptLinking.resetStatus()
  }, [modal, acceptLinking])

  return (
    <BaseModal onClose={handleClose} isOpen={(modal.open && !isTxModalOpen) ?? false}>
      <VStack alignItems="stretch" gap={6}>
        <VStack justifyContent="center" alignItems="center" gap={10}>
          <ExclamationTriangle size={triangleSize} />
          <Heading size={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to accept the linking proposal?")}
          </Heading>
        </VStack>
        <VStack alignItems="stretch">
          <Text fontWeight="semibold">{t("You’re accepting it from")}</Text>
          <Text textStyle="sm">{domain}</Text>
          <Text textStyle="sm">{secondaryAccount}</Text>
        </VStack>
        <Alert.Root status="warning" borderRadius="2xl">
          <Alert.Indicator w={9} h={9} />
          <Box textStyle="sm">
            <Alert.Title as="span">{t("You will use the actions performed in this address.")}</Alert.Title>
            <Alert.Description as="span">{t("once you have accepted the linking proposal.")}</Alert.Description>
          </Box>
        </Alert.Root>
        <VStack>
          <Button variant="primary" onClick={handleDelegate}>
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
