import {
  AllocationProposalCreated,
  AllocationProposalState,
  useAllocationsRoundState,
  useCurrentAllocationsRoundId,
  useCurrentBlock,
} from "@/api"
import { Box, Card, CardBody, HStack, Heading, Icon, Tag, Text, useColorModeValue } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { FaAngleRight } from "react-icons/fa6"

type Props = {
  round: AllocationProposalCreated
}

const blockTime = getConfig().network.blockTime

export const AllocationRoundCard: React.FC<Props> = ({ round }) => {
  const router = useRouter()

  const { data: currentBlock } = useCurrentBlock()

  const { data: state } = useAllocationsRoundState(round.proposalId)
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  const isCurrentRound = round.proposalId === currentRoundId

  const estimatedEndTime = useMemo(() => {
    const endBlock = Number(round.voteEnd)
    if (!endBlock || !currentBlock) return null
    const endBlockFromNow = endBlock - currentBlock.number
    //not ended yet
    if (endBlockFromNow > 0) {
      const durationLeftTimestamp = endBlockFromNow * blockTime
      const endDate = dayjs().add(durationLeftTimestamp, "milliseconds")
      return endDate.fromNow()
    } else {
      const durationLeftTimestamp = -endBlockFromNow * blockTime
      const endDate = dayjs().subtract(durationLeftTimestamp, "milliseconds")
      return endDate.fromNow()
    }
  }, [currentBlock, round])

  const onRoundClick = () => {
    router.push(`/rounds/${round.proposalId}`)
  }

  const cardHoverColor = useColorModeValue("primary.500", "primary.300")
  return (
    <Card
      w="full"
      variant="outline"
      borderWidth={isCurrentRound ? 3 : 1}
      onClick={onRoundClick}
      _hover={{
        borderColor: cardHoverColor,
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
      }}>
      <CardBody>
        <HStack justify={"space-between"} w="full">
          <Box>
            <HStack spacing={2}>
              <Heading as="h3" size="md">
                Round #{round.proposalId}
              </Heading>
              <Tag colorScheme="green">{state && AllocationProposalState[state]}</Tag>
            </HStack>
            <Text>{estimatedEndTime}</Text>
          </Box>
          <Icon as={FaAngleRight} boxSize={6} />
        </HStack>
      </CardBody>
    </Card>
  )
}
