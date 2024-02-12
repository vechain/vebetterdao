import { AllocationProposalCreated, AllocationProposalState, useAllocationsRound } from "@/api"
import { Box, Card, CardBody, HStack, Heading, Icon, Tag, Text, useColorModeValue } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { useRouter } from "next/navigation"
import { FaAngleRight } from "react-icons/fa6"

type Props = {
  round: AllocationProposalCreated
}

const blockTime = getConfig().network.blockTime

export const AllocationRoundCard: React.FC<Props> = ({ round }) => {
  const router = useRouter()

  const { data: allocationRound } = useAllocationsRound(round.proposalId)

  const onRoundClick = () => {
    router.push(`/rounds/${round.proposalId}`)
  }

  const cardHoverColor = useColorModeValue("primary.500", "primary.300")
  return (
    <Card
      w="full"
      variant="outline"
      borderWidth={allocationRound.isCurrent ? 3 : 1}
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
              <Tag colorScheme="green">{allocationRound.state && AllocationProposalState[allocationRound.state]}</Tag>
            </HStack>
            <Text>{allocationRound.voteEndTimestamp?.fromNow()}</Text>
          </Box>
          <Icon as={FaAngleRight} boxSize={6} />
        </HStack>
      </CardBody>
    </Card>
  )
}
