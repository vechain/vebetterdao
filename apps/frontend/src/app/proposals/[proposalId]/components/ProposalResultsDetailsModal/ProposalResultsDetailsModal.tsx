import { MulticolorBar, RegularModal, ResultsDisplay, ResultsDetailsList } from "@/components"
import { VStack, Heading, HStack, Icon, Separator } from "@chakra-ui/react"
import { FiBarChart2 } from "react-icons/fi"
import { t } from "i18next"

type Props = {
  isResultsModalOpen: boolean
  onClose: () => void
  progressBarSegments: { percentage: number; color: string; icon: React.ElementType }[]
  userDeposits: bigint
  proposalDepositThreshold: bigint
  resultsDetails: { label: string; value: string }[]
  isVotingPhase: boolean
}

export const ProposalResultsDetailsModal = ({
  isResultsModalOpen,
  onClose,
  progressBarSegments,
  userDeposits,
  proposalDepositThreshold,
  resultsDetails,
  isVotingPhase,
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
