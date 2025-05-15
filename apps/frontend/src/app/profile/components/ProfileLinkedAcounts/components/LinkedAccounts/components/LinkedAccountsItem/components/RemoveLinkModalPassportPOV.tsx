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
import { useRemoveEntityLink } from "@/hooks"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
export const RemoveLinkModalPassportPOV = ({ modal, entity }: { modal: UseDisclosureProps; entity: string }) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { isOpen = false, onClose } = modal

  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  const removeLinking = useRemoveEntityLink({
    onSuccess: handleClose,
  })

  const handleRemoveLink = useCallback(() => {
    removeLinking.sendTransaction({ entity })
  }, [removeLinking, entity])

  const triangleSize = useBreakpointValue({ base: 100, md: 220 })

  return (
    <BaseModal onClose={handleClose} isOpen={isOpen && !isTxModalOpen}>
      <VStack align="stretch" gap={6}>
        <VStack justify="center" align="center" gap={10}>
          <ExclamationTriangle color="#C84968" size={triangleSize} />
          <Heading fontSize={["lg", "lg", "2xl"]} textAlign="center">
            {t("Are you sure you want to remove the linking?")}
          </Heading>
        </VStack>
        <VStack align="stretch">
          <Text fontWeight="600">{t("You’re removing it from")}</Text>
          <Text fontSize="sm">{entity}</Text>
        </VStack>
        <Alert status="error" borderRadius="2xl">
          <AlertIcon w={9} h={9} />
          <Box lineHeight={"1.20rem"} color="#C84968" fontSize="sm">
            <AlertTitle as="span">{t("You will not able to use the actions performed in this address.")}</AlertTitle>
            <AlertDescription as="span">{t("once you have removed the linking.")}</AlertDescription>
          </Box>
        </Alert>
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
