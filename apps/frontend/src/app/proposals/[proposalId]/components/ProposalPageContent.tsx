import { Grid, GridItem, VStack } from "@chakra-ui/react"
import { ProposalOverview } from "./ProposalOverview"
import { ProposalContentAndActions } from "./ProposalContentAndActions/ProposalContentAndActions"
import { useProposalCreatedEvent } from "@/api"

type Props = {
  proposalId: string
}

export const ProposalPageContent: React.FC<Props> = ({ proposalId }) => {
  const { data: proposal } = useProposalCreatedEvent(proposalId)

  if (!proposal) return null

  return (
    <VStack w="full" alignItems="stretch" spacing={"40px"}>
      <ProposalOverview />
      <Grid templateColumns="repeat(3, 1fr)" gap={[4, 4, 8]} w="full">
        <GridItem colSpan={[3, 3, 2]}>
          <ProposalContentAndActions proposal={proposal} />
        </GridItem>
        <GridItem colSpan={[3, 3, 1]}></GridItem>
      </Grid>
    </VStack>
  )
}
