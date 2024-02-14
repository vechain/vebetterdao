import { AllocationProposalState, useAllocationsRound } from "@/api"
import {
  HStack,
  Button,
  Heading,
  Box,
  Text,
  Icon,
  Tag,
  Stack,
  useBreakpoint,
  useMediaQuery,
  IconButton,
  VStack,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"

export const AllocationRoundNavbar = ({ roundId }: { roundId: string }) => {
  const router = useRouter()
  const { data, isLoading } = useAllocationsRound(roundId)
  const [isDesktop] = useMediaQuery("(min-width: 800px)")

  const prevButtonDisabled = !data.proposalId || data.proposalId === "1"
  const goToPreviousRound = () => {
    if (prevButtonDisabled) return
    const prevRoud = Number(data?.proposalId) - 1
    router.push(`/rounds/${prevRoud}`)
  }

  const nextButtonDisabled = !data.proposalId || data.isCurrent

  const goToNextRound = () => {
    if (!nextButtonDisabled) return
    const nextRound = Number(data?.proposalId) + 1
    router.push(`/rounds/${nextRound}`)
  }

  if (isDesktop)
    return (
      <HStack w="full" justify={"space-between"} align="center">
        <Button
          size="sm"
          aria-label="Go to previous round"
          isDisabled={prevButtonDisabled}
          onClick={goToPreviousRound}
          leftIcon={<FaArrowLeft />}>
          Previous round
        </Button>

        <Stack direction={["column", "column", "row"]} spacing={4} align={"center"}>
          <Heading size="md">{data?.proposalId}° round</Heading>
          <Box w={1.5} h={1.5} borderRadius={"full"} bg="gray" />
          <HStack spacing={2} align={"center"}>
            <Text>{data?.voteStartTimestamp?.format("D MMMM")}</Text>
            <Icon as={FaArrowRight} />
            <Text>{data?.voteEndTimestamp?.format("D MMMM")}</Text>
          </HStack>
          <Tag colorScheme="primary" variant="solid">
            {data?.state && AllocationProposalState[data.state]}
          </Tag>
        </Stack>
        <Button
          size="sm"
          aria-label="Go to next round"
          isDisabled={nextButtonDisabled}
          onClick={goToNextRound}
          rightIcon={<FaArrowRight />}>
          Next round
        </Button>
      </HStack>
    )

  return (
    <HStack w="full" justify={"space-between"} align="center">
      <IconButton
        icon={<FaArrowLeft />}
        isDisabled={prevButtonDisabled}
        onClick={goToPreviousRound}
        aria-label="Go to previous round"
      />
      <VStack w="full">
        <HStack spacing={4}>
          <Heading size="md">{data?.proposalId}° round</Heading>
          <Tag colorScheme="primary" variant="solid">
            {data?.state && AllocationProposalState[data.state]}
          </Tag>
        </HStack>

        <HStack spacing={2} align={"center"}>
          <Text>{data?.voteStartTimestamp?.format("D MMMM")}</Text>
          <Icon as={FaArrowRight} />
          <Text>{data?.voteEndTimestamp?.format("D MMMM")}</Text>
        </HStack>
      </VStack>
      <IconButton
        icon={<FaArrowRight />}
        aria-label="Go to next round"
        onClick={goToNextRound}
        isDisabled={nextButtonDisabled}
      />
    </HStack>
  )
}
