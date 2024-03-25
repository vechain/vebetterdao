import { useAllocationsRound } from "@/api"
import { AllocationRoundStateTag } from "@/components/AllocationRoundsList/AllocationRoundStateTag"
import {
  HStack,
  Button,
  Heading,
  Box,
  Text,
  Icon,
  Stack,
  useMediaQuery,
  IconButton,
  VStack,
  Skeleton,
  Container,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"

export const AllocationRoundNavbar = ({ roundId }: { roundId: string }) => {
  const router = useRouter()
  const { data, isLoading } = useAllocationsRound(roundId)
  const [isDesktop] = useMediaQuery("(min-width: 800px)")

  const prevButtonDisabled = !data.roundId || data.roundId === "1"
  const goToPreviousRound = () => {
    if (prevButtonDisabled) return
    const prevRoud = Number(data?.roundId) - 1
    router.push(`/rounds/${prevRoud}`)
  }

  const nextButtonDisabled = !data.roundId || data.isCurrent

  const goToNextRound = () => {
    if (nextButtonDisabled) return
    const nextRound = Number(data?.roundId) + 1
    router.push(`/rounds/${nextRound}`)
  }

  const bgColor = data.isCurrent ? "#B2F26C" : "rgba(233, 233, 233, 1)"

  // State to store the client width
  const [clientWidth, setClientWidth] = useState(document.body.clientWidth);

  // Effect to update the clientWidth state on window resize
  useEffect(() => {
    const updateWidth = () => {
      setClientWidth(document.body.clientWidth);
    };

    // Set initial width
    updateWidth();

    // Add window resize event listener
    window.addEventListener('resize', updateWidth);

    // Clean up listener on component unmount
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (isDesktop)
    return (
      <HStack w={clientWidth} align="center" bgColor={bgColor} mt={-10} py={3}>
        <Container
          maxW={"container.xl"}
          display={"flex"}
          flex={1}
          alignItems={"center"}
          justifyContent={"space-between"}
          flexDirection={"row"}
          px={20}>
          <Button
            size="sm"
            variant={"ghost"}
            aria-label="Go to previous round"
            isDisabled={prevButtonDisabled}
            onClick={goToPreviousRound}
            leftIcon={<FaArrowLeft />}>
            Previous round
          </Button>

          <Stack direction={["column", "column", "row"]} spacing={4} align={"center"}>
            <Skeleton isLoaded={!isLoading}>
              <Heading size="md">Round #{data?.roundId}</Heading>
            </Skeleton>
            <Box w={1.5} h={1.5} borderRadius={"full"} bg="gray" />
            <HStack spacing={2} align={"center"}>
              <Skeleton isLoaded={!isLoading}>
                <Text>{!isLoading ? data?.voteStartTimestamp?.format("D MMMM") : "8 February"}</Text>
              </Skeleton>
              <Icon as={FaArrowRight} />
              <Skeleton isLoaded={!isLoading}>
                <Text>{!isLoading ? data?.voteEndTimestamp?.format("D MMMM") : "8 February"}</Text>
              </Skeleton>
            </HStack>
            <AllocationRoundStateTag state={data?.state} size="md" renderInTag={true} variant={"subtle"} />
          </Stack>
          <Button
            variant={"ghost"}
            size="sm"
            aria-label="Go to next round"
            isDisabled={nextButtonDisabled}
            onClick={goToNextRound}
            rightIcon={<FaArrowRight />}>
            Next round
          </Button>
        </Container>
      </HStack>
    )

  return (
    <HStack w="100vw" justify={"space-between"} align="center" bgColor={bgColor} px={4} py={2}>
      <IconButton
        variant={"ghost"}
        icon={<FaArrowLeft />}
        isDisabled={prevButtonDisabled}
        onClick={goToPreviousRound}
        aria-label="Go to previous round"
      />
      <VStack w="full">
        <HStack spacing={4}>
          <Skeleton isLoaded={!isLoading}>
            <Heading size="md">#{data?.roundId} round</Heading>
          </Skeleton>
          <AllocationRoundStateTag state={data?.state} size="md" renderInTag={true} variant={"subtle"} />
        </HStack>

        <HStack spacing={2} align={"center"}>
          <Skeleton isLoaded={!isLoading}>
            <Text>{!isLoading ? data?.voteStartTimestamp?.format("D MMMM") : "8 February"}</Text>
          </Skeleton>
          <Icon as={FaArrowRight} />
          <Skeleton isLoaded={!isLoading}>
            <Text>{!isLoading ? data?.voteEndTimestamp?.format("D MMMM") : "8 February"}</Text>
          </Skeleton>
        </HStack>
      </VStack>
      <IconButton
        variant={"ghost"}
        icon={<FaArrowRight />}
        aria-label="Go to next round"
        onClick={goToNextRound}
        isDisabled={nextButtonDisabled}
      />
    </HStack>
  )
}
