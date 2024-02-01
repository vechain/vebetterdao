import { ProposalCreatedEvent, ProposalState, useProposalState } from "@/api"
import { Box, Card, CardBody, CardFooter, CardHeader, HStack, Heading, Tag, Text, VStack } from "@chakra-ui/react"
import { AddressButton } from "./AddressButton"

type Props = {
  proposal: ProposalCreatedEvent
}
export const ProposalCard: React.FC<Props> = ({ proposal }) => {
  const { data: state } = useProposalState(proposal.proposalId)
  return (
    <Card>
      <CardHeader>
        <VStack spacing={4} w="full" align="flex-start">
          <HStack w="full" justify="space-between">
            <Tag colorScheme="blue">Governance</Tag>
            <Tag colorScheme="green">{!!state && ProposalState[state]}</Tag>
          </HStack>
          <Heading as="h3" size="md">
            {proposal.description}
          </Heading>
        </VStack>
      </CardHeader>
      <CardBody>
        <Box>
          <Text>Proposer</Text>
          <AddressButton address={proposal.proposer} buttonSize="xs" addressFontSize="xs" />
        </Box>
      </CardBody>
      <CardFooter>
        <HStack justify={"space-between"} w="full">
          <Box>
            <Text>Ends at block</Text>
            <Heading as="h4" size="sm">
              {proposal.voteEnd}
            </Heading>
          </Box>
        </HStack>
      </CardFooter>
    </Card>
  )
}
