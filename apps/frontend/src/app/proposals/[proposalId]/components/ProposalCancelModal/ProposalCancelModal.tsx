import { Button, Heading, HStack, Text, Textarea, VStack } from "@chakra-ui/react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { BaseModal } from "@/components/BaseModal"
import { useCancelProposal } from "@/hooks/useCancelProposal"

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
  const [reason, setReason] = useState("")
  const cancelProposalMutation = useCancelProposal({
    proposalId,
  })
  const handleCancelProposal = useCallback(() => {
    onClose()
    cancelProposalMutation.sendTransaction({ reason })
  }, [cancelProposalMutation, onClose, reason])
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
            "If you cancel now, your grant will be removed and won't appear in the next voting round. Once the round begins, cancellation will no longer be possible.",
          )}
        </Text>

        {/* Reason Section */}
        <VStack align="stretch" gap={2}>
          <HStack>
            <Text>{t("Reason")}</Text>
            <Text textStyle="sm" color="gray.500" fontStyle={"italic"}>
              {t("Optional")}
            </Text>
          </HStack>
          <Textarea
            placeholder={t("Please provide a reason for cancelling this proposal")}
            value={reason}
            onChange={e => setReason(e.target.value)}
            resize="none"
            rows={4}
            fontSize={"16px"}
          />
        </VStack>

        {/* Cancel Button */}
        <Button colorPalette="red" w={{ base: "full", md: "full" }} alignSelf="flex-end" onClick={handleCancelProposal}>
          {t("Cancel {{proposalType}}", { proposalType: proposalTypeText })}
        </Button>
      </VStack>
    </BaseModal>
  )
}
