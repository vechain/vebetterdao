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
    <BaseModal onClose={handleClose} isOpen={(modal.isOpen && !isTxModalOpen) ?? false}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to accept the linking proposal?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="600">{t("You’re accepting it from")}</Text>
          <Text fontSize="sm">{domain}</Text>
          <Text fontSize="sm">{secondaryAccount}</Text>
        </VStack>
        <Alert status="warning" borderRadius="2xl">
          <AlertIcon w={9} h={9} />
          <Box lineHeight={"1.20rem"} fontSize="sm">
            <AlertTitle as="span">{t("You will use the actions performed in this address.")}</AlertTitle>
            <AlertDescription as="span">{t("once you have accepted the linking proposal.")}</AlertDescription>
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
