import { VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalContentAndActions } from "./ProposalContentAndActions/ProposalContentAndActions"
import { useProposal, useProposalCreatedEvent } from "@/api"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: proposal } = useProposalCreatedEvent(proposalId)

  if (!proposal) return null

  return (
    <VStack w="full" alignItems="stretch">
      <ProposalOverview />
      <ProposalContentAndActions proposal={proposal} />
    </VStack>
  )
}
