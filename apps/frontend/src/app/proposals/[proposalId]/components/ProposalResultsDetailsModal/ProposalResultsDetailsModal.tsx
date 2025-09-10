import { MulticolorBar, RegularModal, ResultsDetailsList, ResultsDisplay } from "@/components"
import { Heading, HStack, Icon, Separator, VStack } from "@chakra-ui/react"
import { t } from "i18next"
import { FiBarChart2 } from "react-icons/fi"

type Props = {
  isResultsModalOpen: boolean
  onClose: () => void
  progressBarSegments: { percentage: number; color: string; icon: React.ElementType }[]
  userDeposits: bigint
  proposalDepositThreshold: bigint
  resultsDetails: { label: string; value: string }[]
  isVotingPhase: boolean
  proposalId: string
}

export const ProposalResultsDetailsModal = ({
  isResultsModalOpen,
  onClose,
  progressBarSegments,
  userDeposits,
  proposalDepositThreshold,
  resultsDetails,
  isVotingPhase,
  proposalId,
}: Props) => {
  return (
    <RegularModal
      size="md"
      showCloseButton
      isCloseable
      ariaTitle={t("Result details")}
      isOpen={isResultsModalOpen}
      onClose={onClose}>
      <VStack w="full" align="stretch" gap={4}>
        {/* Modal Header */}
        <HStack>
          <Icon as={FiBarChart2} boxSize={5} />
          <Heading>{t("Results")}</Heading>
        </HStack>

        {/* Progress Bar */}
        <MulticolorBar segments={progressBarSegments} />

        {/* Results Display with Token Amount */}
        <ResultsDisplay
          proposalId={proposalId}
          segments={progressBarSegments}
          tokenAmount={isVotingPhase ? (userDeposits ?? BigInt(0)) : proposalDepositThreshold}
          showTokenAmount
        />

        <Separator />

        {/* Results Details List */}
        <ResultsDetailsList details={resultsDetails} />
      </VStack>
    </RegularModal>
  )
}
