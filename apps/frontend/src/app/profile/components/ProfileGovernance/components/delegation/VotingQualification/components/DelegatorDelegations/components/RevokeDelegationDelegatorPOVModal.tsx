import { BaseModal } from "@/components/BaseModal"
import { Heading, Text, UseDisclosureProps, VStack, Button, Box, Alert, useBreakpointValue } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback } from "react"
import { ExclamationTriangle } from "@/components"
import { useRevokeDelegation } from "@/hooks"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

export const RevokeDelegationDelegatorPOVModal = ({
  modal,
  delegatee,
}: {
  modal: UseDisclosureProps
  delegatee: string
}) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const revokeDelegation = useRevokeDelegation({
    isDelegator: true,
  })

  const handleDelegate = useCallback(() => {
    revokeDelegation.sendTransaction()
  }, [revokeDelegation])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  const handleClose = useCallback(() => {
    modal.onClose?.()
    revokeDelegation.resetStatus()
  }, [modal, revokeDelegation])

  return (
    <BaseModal onClose={handleClose} isOpen={(modal.open && !isTxModalOpen) ?? false}>
      <VStack alignItems="stretch" gap={6}>
        <VStack justifyContent="center" alignItems="center" gap={10}>
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading size={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want remove your Voting Qualification delegation?")}
          </Heading>
        </VStack>
        <VStack alignItems="stretch">
          <Text fontWeight="600">{t("You’re removing it from")}</Text>
          <Text textStyle="sm">{delegatee}</Text>
        </VStack>
        <Alert.Root status="error" borderRadius="2xl">
          <Alert.Indicator w={9} h={9} />
          <Box lineHeight={"1.20rem"} color="#C84968" textStyle="sm">
            <Alert.Title as="span">
              {t("This address won’t be able to vote using your Voting Qualification")}
            </Alert.Title>
            <Alert.Description as="span">{t("once you have removed the delegation.")}</Alert.Description>
          </Box>
        </Alert.Root>
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
