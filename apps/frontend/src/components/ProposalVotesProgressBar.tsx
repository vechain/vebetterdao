import { ProposalCreatedEvent, useProposalQuorum, useProposalVotes } from "@/api"
import { Box, HStack, Heading, Icon, Progress, Skeleton, Text } from "@chakra-ui/react"
import { useMemo } from "react"
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa6"

type Props = {
  proposal: ProposalCreatedEvent
}
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const ProposalVotesProgressBar: React.FC<Props> = ({ proposal }) => {
  const {
    data: proposalVotes,
    error: proposalVotesError,
    isLoading: proposalVotesLoading,
  } = useProposalVotes(proposal.proposalId)
  const { data: quorum, isLoading: quorumLoading } = useProposalQuorum(proposal.voteStart)

  const progress = useMemo(() => {
    if (!proposalVotes) return 0
    const totalVotes =
      Number(proposalVotes.forVotes) + Number(proposalVotes.againstVotes) + Number(proposalVotes.abstainVotes)
    const progress = (Number(proposalVotes.forVotes) / totalVotes) * 100
    if (isNaN(progress)) return 0
    return progress
  }, [proposalVotes])

  const quorumProgress = useMemo(() => {
    const compactQuorum = compactFormatter.format(Number(quorum?.scaled))
    const isLoaded = !quorumLoading && !proposalVotesLoading
    const totalVotes =
      Number(proposalVotes?.forVotes) + Number(proposalVotes?.againstVotes) + Number(proposalVotes?.abstainVotes)
    if (!isLoaded)
      return (
        <Skeleton>
          <Heading size="sm" color="gray.500" textAlign={"center"}>
            100k votes needed to reach quorum
          </Heading>
        </Skeleton>
      )
    if (totalVotes > Number(quorum?.scaled)) {
      return (
        <Heading size="xs" color="green.500" textAlign={"center"}>
          Quorum reached
        </Heading>
      )
    }
    return (
      <Heading size="xs" color="orange.500" textAlign={"center"}>
        {compactQuorum} votes needed to reach quorum
      </Heading>
    )
  }, [proposalVotes, quorum, proposalVotesLoading, quorumLoading])

  return (
    <Box w="full">
      {quorumProgress}
      <HStack w="full">
        <HStack spacing={1}>
          <Icon as={FaThumbsUp} color="green.500" fontSize={"md"} />
          <Text fontSize="sm" color="gray.500">
            {compactFormatter.format(Number(proposalVotes?.forVotes))}
          </Text>
        </HStack>

        <Progress w="full" colorScheme="green" size="lg" value={progress} borderRadius={"lg"} />
        <HStack spacing={1}>
          <Icon as={FaThumbsDown} color="red.500" fontSize={"md"} />
          <Text fontSize="sm" color="gray.500">
            {compactFormatter.format(Number(proposalVotes?.againstVotes))}
          </Text>
        </HStack>
      </HStack>
      <Text fontSize="sm" color="gray.500" textAlign={"center"}>
        {compactFormatter.format(Number(proposalVotes?.abstainVotes))} preferred to abastain
      </Text>
    </Box>
  )
}
