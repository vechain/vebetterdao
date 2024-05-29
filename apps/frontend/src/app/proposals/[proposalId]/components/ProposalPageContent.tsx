import { Grid, GridItem, VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalContentAndActions } from "./ProposalContentAndActions/ProposalContentAndActions"
import { useProposalCreatedEvent } from "@/api"
import { ProposalCommunitySupport } from "./ProposalCommunitySupport"
import { ProposalWithdrawDeposit } from "./ProposalWithdrawDeposit"
import { ProposalSessionSection } from "./ProposalSessionSection"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: proposal } = useProposalCreatedEvent(proposalId)

  if (!proposal) return null

  return (
    <VStack w="full" alignItems="stretch" gap={8}>
      <ProposalOverview />
      <Grid templateColumns="repeat(3, 1fr)" gap={[8, 8, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]} gap={8}>
          <VStack align="stretch" gap={8}>
            <ProposalCommunitySupport />
            <ProposalContentAndActions proposal={proposal} />
          </VStack>
        </GridItem>
        <GridItem colSpan={[3, 3, 1]}>
          <VStack align="stretch" gap={8}>
            <ProposalWithdrawDeposit />
            <ProposalSessionSection />
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  )
}
