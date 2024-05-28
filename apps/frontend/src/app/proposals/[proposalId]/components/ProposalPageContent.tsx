import { Grid, GridItem, VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalContentAndActions } from "./ProposalContentAndActions/ProposalContentAndActions"
import { ProposalState, useProposalCreatedEvent, useProposalState } from "@/api"
import { ProposalCommunitySupport } from "./ProposalCommunitySupport"
import { ProposalWithdrawDeposit } from "./ProposalWithdrawDeposit"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: proposal } = useProposalCreatedEvent(proposalId)
  const { data: proposalState } = useProposalState(proposalId)

  if (!proposal) return null

  return (
    <VStack w="full" alignItems="stretch" spacing={"40px"}>
      <ProposalOverview />
      <Grid templateColumns="repeat(3, 1fr)" gap={[4, 4, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]} gap={8}>
          {proposalState === ProposalState.Pending && <ProposalCommunitySupport />}
        </GridItem>
        <GridItem colSpan={[3, 3, 2]} gap={8}>
          <ProposalContentAndActions proposal={proposal} />
        </GridItem>
        <GridItem colSpan={[3, 3, 1]}>
          <ProposalWithdrawDeposit />
        </GridItem>
      </Grid>
    </VStack>
  )
}
