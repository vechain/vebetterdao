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

import { useAllocationsRound } from "../../../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useAllocationsRoundState } from "../../../../api/contracts/xAllocations/hooks/useAllocationsRoundState"
import { AllocationStateBadge } from "../../../../components/AllocationStateBadge/AllocationStateBadge"
export const AllocationRoundNavbar = ({ roundId }: { roundId: string }) => {
  const router = useRouter()
  const { t } = useTranslation()
  const { data, isLoading } = useAllocationsRound(roundId)
  const [isDesktop] = useMediaQuery(["(min-width: 800px)"])
  const prevButtonDisabled = !data.roundId || data.roundId === "1"
  const goToPreviousRound = () => {
    if (prevButtonDisabled) return
    const prevRoud = Number(data?.roundId) - 1
    router.push(`/rounds/${prevRoud}`)
  }
  const { data: state } = useAllocationsRoundState(roundId)
  const isActive = state === 0
  const nextButtonDisabled = !data.roundId || data.isCurrent
  const goToNextRound = () => {
    if (nextButtonDisabled) return
    const nextRound = Number(data?.roundId) + 1
    router.push(`/rounds/${nextRound}`)
  }
  const bgColor = data.state === 0 ? "banner.green" : "bg.primary"
  // State to store the client width
  const [clientWidth, setClientWidth] = useState(0)

  // Effect to update the clientWidth state using ResizeObserver
  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setClientWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(document.body)

    return () => resizeObserver.disconnect()
  }, [])

  if (isDesktop)
    return (
      <HStack
        w={clientWidth}
        align="center"
        bgColor={bgColor}
        mt={-10}
        py={3}
        data-testid={`allocation-round-${roundId}-nav-desktop`}>
        <Container
          maxW="breakpoint-xl"
          display={"flex"}
          flex={1}
          alignItems={"center"}
          justifyContent={"space-between"}
          flexDirection={"row"}
          px={20}>
          <Button
            data-testid="prev-round-button"
            color="icon.default"
            size="sm"
            variant={"plain"}
            aria-label="Go to previous round"
            disabled={prevButtonDisabled}
            onClick={goToPreviousRound}>
            <Icon as={FaArrowLeft} color="icon.default" />
            {t("Previous round")}
          </Button>

          <Stack direction={["column", "column", "row"]} gap={4} align={"center"}>
            <Skeleton loading={isLoading}>
              <Heading size="lg">{t("Round #{{round}}", { round: data?.roundId })}</Heading>
            </Skeleton>
            <Box w={1.5} h={1.5} borderRadius={"full"} bg={"text.subtle"} />
            <HStack gap={2} align={"center"}>
              <Skeleton loading={isLoading}>
                <Text>{!isLoading ? data?.voteStartTimestamp?.format("D MMMM") : "8 February"}</Text>
              </Skeleton>
              <Icon as={FaArrowRight} color="icon.default" />
              <Skeleton loading={isLoading}>
                <Text>{!isLoading ? data?.voteEndTimestamp?.format("D MMMM") : "8 February"}</Text>
              </Skeleton>
            </HStack>
            <AllocationStateBadge roundId={roundId} renderIcon={isActive} />
          </Stack>
          <Button
            data-testid="next-round-button"
            variant={"plain"}
            size="sm"
            color="icon.default"
            aria-label="Go to next round"
            disabled={nextButtonDisabled}
            onClick={goToNextRound}>
            {t("Next round")}

            <Icon as={FaArrowRight} color="icon.default" />
          </Button>
        </Container>
      </HStack>
    )

  return (
    <HStack
      w="100vw"
      justify={"space-between"}
      align="center"
      bgColor={bgColor}
      px={4}
      py={2}
      mt={-2}
      data-testid={`allocation-round-${roundId}-nav-mobile`}>
      <IconButton
        data-testid="prev-round-button"
        color="icon.default"
        variant={"ghost"}
        disabled={prevButtonDisabled}
        onClick={goToPreviousRound}
        aria-label="Go to previous round">
        <FaArrowLeft />
      </IconButton>
      <VStack w="full">
        <HStack gap={4}>
          <Skeleton loading={isLoading}>
            <Heading size="xl" color="text.default">
              {t("Round #{{round}}", { round: data?.roundId ?? 0 })}
            </Heading>
          </Skeleton>
          <AllocationStateBadge roundId={roundId} renderIcon={isActive} />
        </HStack>

        <HStack gap={2} align={"center"}>
          <Skeleton loading={isLoading}>
            <Text>{!isLoading ? data?.voteStartTimestamp?.format("D MMMM") : "8 February"}</Text>
          </Skeleton>
          <Icon as={FaArrowRight} color="icon.default" />
          <Skeleton loading={isLoading}>
            <Text>{!isLoading ? data?.voteEndTimestamp?.format("D MMMM") : "8 February"}</Text>
          </Skeleton>
        </HStack>
      </VStack>
      <IconButton
        data-testid="next-round-button"
        color="icon.default"
        variant={"ghost"}
        aria-label="Go to next round"
        onClick={goToNextRound}
        disabled={nextButtonDisabled}>
        <FaArrowRight />
      </IconButton>
    </HStack>
  )
}
