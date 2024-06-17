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
import { useTranslation } from "react-i18next"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"

export const AllocationRoundNavbar = ({ roundId }: { roundId: string }) => {
  const router = useRouter()
  const { t } = useTranslation()
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

  const bgColor = data.isCurrent ? "#B1F16C" : "#E0E9FE"

  // State to store the client width
  const [clientWidth, setClientWidth] = useState(document.body.clientWidth)

  // Effect to update the clientWidth state on window resize
  useEffect(() => {
    const updateWidth = () => {
      setClientWidth(document.body.clientWidth)
    }

    // Set initial width
    updateWidth()

    // Add window resize event listener
    window.addEventListener("resize", updateWidth)

    // Clean up listener on component unmount
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

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
            color={prevButtonDisabled ? "#757575" : "#004CFC"}
            size="sm"
            variant={"ghost"}
            aria-label="Go to previous round"
            isDisabled={prevButtonDisabled}
            onClick={goToPreviousRound}
            leftIcon={<FaArrowLeft />}>
            {t("Previous round")}
          </Button>

          <Stack direction={["column", "column", "row"]} spacing={4} align={"center"}>
            <Skeleton isLoaded={!isLoading}>
              <Heading size="md">
                {t("Round #{{round}}", {
                  round: data?.roundId,
                })}
              </Heading>
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
            color={nextButtonDisabled ? "#757575" : "#004CFC"}
            aria-label="Go to next round"
            isDisabled={nextButtonDisabled}
            onClick={goToNextRound}
            rightIcon={<FaArrowRight />}>
            {t("Next round")}
          </Button>
        </Container>
      </HStack>
    )

  return (
    <HStack w="100vw" justify={"space-between"} align="center" bgColor={bgColor} px={4} py={2}>
      <IconButton
        color={prevButtonDisabled ? "#757575" : "#004CFC"}
        variant={"ghost"}
        icon={<FaArrowLeft />}
        isDisabled={prevButtonDisabled}
        onClick={goToPreviousRound}
        aria-label="Go to previous round"
      />
      <VStack w="full">
        <HStack spacing={4}>
          <Skeleton isLoaded={!isLoading}>
            <Heading size="md">
              {t("#{{round}} round", {
                round: data?.roundId ?? 0,
              })}
            </Heading>
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
        color={nextButtonDisabled ? "#757575" : "#004CFC"}
        variant={"ghost"}
        icon={<FaArrowRight />}
        aria-label="Go to next round"
        onClick={goToNextRound}
        isDisabled={nextButtonDisabled}
      />
    </HStack>
  )
}
