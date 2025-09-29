import { useCancelProposal } from "@/hooks/useCancelProposal"
import { Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { BaseModal } from "@/components/BaseModal"
import { GenericAlert } from "@/app/components/Alert/GenericAlert"

export const ProposalCancelModal = ({
  proposalId,
  isOpen,
  onClose,
}: {
  proposalId: string
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useTranslation()

  const cancelProposalMutation = useCancelProposal({
    proposalId,
  })

  const handleCancelProposal = useCallback(() => {
    onClose()
    cancelProposalMutation.sendTransaction()
  }, [cancelProposalMutation, onClose])

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      ariaTitle={t("Cancel proposal")}
      showCloseButton={true}
      isCloseable={true}>
      <VStack w="full" align="stretch" gap={6}>
        {/* Results Header */}
        <HStack>
          <Heading>{t("Cancel proposal")}</Heading>
        </HStack>

        <Text>{t("Are you completely sure to cancel this proposal?")}</Text>

        {/* Info Message */}
        <GenericAlert
          type="warning"
          isLoading={false}
          message={t("Community support will be returned, and you cannot recover this proposal.")}
        />

        {/* Support Button */}
        <Button variant="dangerFilled" w="full" onClick={handleCancelProposal}>
          {t("Cancel this proposal")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
