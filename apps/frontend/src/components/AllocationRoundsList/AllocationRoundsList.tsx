import { Alert, Box, Button, Card, HStack, Heading, VStack } from "@chakra-ui/react"
import { useAllocationsRoundsEvents } from "@/api"
import { AllocationRoundCard } from "./components/AllocationRoundCard"
import { useCallback, useMemo, useState } from "react"
import { FiArrowUpRight } from "react-icons/fi"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"

type Props = {
  maxRoundsToShow?: number
  showLoadMore?: boolean
  headingSize?: "xl" | "lg" | "md" | "sm" | "xs"
  showViewAll?: boolean
  renderInsideCard?: boolean
}
export const AllocationRoundsList: React.FC<Props> = ({
  maxRoundsToShow = 3,
  showLoadMore = false,
  headingSize = "xl",
  showViewAll = true,
  renderInsideCard = false,
}) => {
  const { t } = useTranslation()
  const router = useRouter()

  const [totalRoundsToShow, setTotalRoundsToShow] = useState<number>(maxRoundsToShow)

  const { data: allocationRoundsEvents, error: allocationRoundEventsError } = useAllocationsRoundsEvents()
  const invertedCreatedRounds = allocationRoundsEvents?.created.slice().reverse()

  const loadMore = useCallback(() => {
    setTotalRoundsToShow(prev => prev + maxRoundsToShow)
  }, [maxRoundsToShow])

  const renderRounds = useMemo(() => {
    return invertedCreatedRounds?.slice(0, totalRoundsToShow)?.map(round => {
      return <AllocationRoundCard roundId={round.roundId} key={round.roundId} />
    })
  }, [totalRoundsToShow, invertedCreatedRounds])

  const renderList = useMemo(() => {
    return (
      <VStack gap={8} w="full" align={"flex-start"}>
        {!renderInsideCard && (
          <HStack w="full" justify="space-between" alignItems={"baseline"}>
            <Heading size={headingSize}>{t("Allocations")}</Heading>
            {invertedCreatedRounds && invertedCreatedRounds.length > maxRoundsToShow && showViewAll && (
              <Button
                variant="link"
                colorScheme="primary"
                rightIcon={<FiArrowUpRight />}
                onClick={() => router.push("/rounds")}>
                {t("See all rounds")}
              </Button>
            )}
          </HStack>
        )}
        <VStack gap={4} w="full">
          {allocationRoundEventsError && (
            <Alert.Root status="error">
              <Alert.Indicator />
              <Box>
                <Alert.Title>{t("Error loading allocation rounds")}</Alert.Title>
                <Alert.Description>{allocationRoundEventsError.message}</Alert.Description>
              </Box>
            </Alert.Root>
          )}
          {renderRounds}
          {invertedCreatedRounds && invertedCreatedRounds.length > totalRoundsToShow && showLoadMore && (
            <Button variant="link" colorScheme="blue" onClick={loadMore}>
              {t("Load more")}
            </Button>
          )}
        </VStack>
      </VStack>
    )
  }, [
    maxRoundsToShow,
    allocationRoundEventsError,
    totalRoundsToShow,
    invertedCreatedRounds,
    renderInsideCard,
    headingSize,
    showViewAll,
    showLoadMore,
    loadMore,
    renderRounds,
    router,
    t,
  ])

  return (
    <>
      {renderInsideCard ? (
        <Card.Root w="full" variant="baseWithBorder">
          <Card.Header>
            <HStack w="full" justify="space-between" alignItems={"baseline"}>
              <Heading size={headingSize}>{t("Allocations")}</Heading>
              {invertedCreatedRounds && invertedCreatedRounds.length > maxRoundsToShow && showViewAll && (
                <Button
                  variant="link"
                  colorScheme="primary"
                  rightIcon={<FiArrowUpRight />}
                  onClick={() => router.push("/rounds")}>
                  {t("See all rounds")}
                </Button>
              )}
            </HStack>
          </Card.Header>
          <Card.Body>{renderList}</Card.Body>
        </Card.Root>
      ) : (
        renderList
      )}
    </>
  )
}
