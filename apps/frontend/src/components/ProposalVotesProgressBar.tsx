import { useProposalVotes } from "@/api"
import { Box, HStack, Icon, Progress, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa6"
import { CastVoteButton } from "./CastVoteButton"

type Props = {
  proposalId: string
}
export const ProposalVotesProgressBar: React.FC<Props> = ({ proposalId }) => {
  const { data: proposalVotes, error } = useProposalVotes(proposalId)

  const progress = useMemo(() => {
    if (!proposalVotes) return 0
    const totalVotes =
      Number(proposalVotes.forVotes) + Number(proposalVotes.againstVotes) + Number(proposalVotes.abstainVotes)
    const progress = (Number(proposalVotes.forVotes) / totalVotes) * 100
    if (isNaN(progress)) return 0
  }, [proposalVotes])

  console.log({ progress })

  return (
    <Box w="full">
      <HStack w="full">
        <HStack spacing={1}>
          <Icon as={FaThumbsUp} color="green.500" fontSize={"md"} />
          <Text fontSize="sm" color="gray.500">
            {proposalVotes?.forVotes}
          </Text>
        </HStack>

        <Progress w="full" colorScheme="green" size="lg" value={progress} />
        <HStack spacing={1}>
          <Icon as={FaThumbsDown} color="red.500" fontSize={"md"} />
          <Text fontSize="sm" color="gray.500">
            {proposalVotes?.againstVotes}
          </Text>
        </HStack>
      </HStack>
      <Text fontSize="sm" color="gray.500" textAlign={"center"}>
        {proposalVotes?.abstainVotes} preferred to abastain
      </Text>
    </Box>
  )
}
