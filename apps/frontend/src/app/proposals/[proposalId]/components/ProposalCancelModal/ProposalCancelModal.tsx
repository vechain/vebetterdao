import { useCancelProposal } from "@/hooks/useCancelProposal"
import { Button, Heading, HStack, Text, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { BaseModal } from "@/components/BaseModal"

export const ProposalCancelModal = ({
  proposalId,
  isOpen,
  proposalTypeText,
  onClose,
}: {
  proposalId: string
  isOpen: boolean
  proposalTypeText: string
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
      ariaTitle={t("Are you sure you want to cancel this {{proposalType}}", { proposalType: proposalTypeText })}
      showCloseButton={true}
      isCloseable={true}>
      <VStack w="full" align="stretch" gap={6}>
        {/* Results Header */}
        <HStack>
          <Heading>
            {t("Are you sure you want to cancel this {{proposalType}}", { proposalType: proposalTypeText })}
          </Heading>
        </HStack>

        {/* Info Message */}
        <Text>
          {t(
            "If you cancel now, your grant will be removed and won’t appear in the next voting round. Once the round begins, cancellation will no longer be possible.",
          )}
        </Text>

        {/* Support Button */}
        <Button
          variant="dangerFilled"
          w={{ base: "full", md: "160px" }}
          alignSelf="flex-end"
          onClick={handleCancelProposal}>
          {t("Cancel {{proposalType}}", { proposalType: proposalTypeText })}
        </Button>
      </VStack>
    </BaseModal>
  )
}
