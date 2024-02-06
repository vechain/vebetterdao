import { useProposalVotes } from "@/api"
import { Box, HStack, Icon, Progress, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { FaThumbsDown, FaThumbsUp } from "react-icons/fa6"

type Props = {
  proposalId: string
}
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
})

export const ProposalVotesProgressBar: React.FC<Props> = ({ proposalId }) => {
  const { data: proposalVotes, error } = useProposalVotes(proposalId)

  const progress = useMemo(() => {
    if (!proposalVotes) return 0
    const totalVotes =
      Number(proposalVotes.forVotes) + Number(proposalVotes.againstVotes) + Number(proposalVotes.abstainVotes)
    const progress = (Number(proposalVotes.forVotes) / totalVotes) * 100
    if (isNaN(progress)) return 0
    return progress
  }, [proposalVotes])

  console.log({ progress })

  return (
    <Box w="full">
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
