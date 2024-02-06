import { useProposalVotes } from "@/api"
import { HStack, Progress } from "@chakra-ui/react"

type Props = {
  proposalId: string
}
export const ProposalVotesProgressBar: React.FC<Props> = ({ proposalId }) => {
  const { data: proposalVotes, error } = useProposalVotes(proposalId)

  return (
    <HStack w="full">
      <Progress colorScheme="green" size="lg" value={80} />
    </HStack>
  )
}
