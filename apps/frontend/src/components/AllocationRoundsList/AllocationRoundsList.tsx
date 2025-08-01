import { Alert, Box, Button, Card, HStack, Heading, Link, VStack } from "@chakra-ui/react"
import { useAllocationsRoundsEvents } from "@/api"
import { AllocationRoundCard } from "./components/AllocationRoundCard"
import { useCallback, useMemo, useState } from "react"
import { FiArrowUpRight } from "react-icons/fi"
import { useTranslation } from "react-i18next"
import NextLink from "next/link"

type Props = {
  maxRoundsToShow?: number
  showLoadMore?: boolean
  showViewAll?: boolean
  renderInsideCard?: boolean
}
export const AllocationRoundsList: React.FC<Props> = ({
  maxRoundsToShow = 3,
  showLoadMore = false,
  showViewAll = true,
  renderInsideCard = false,
}) => {
  const { t } = useTranslation()

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
            <Heading size={["3xl", "4xl"]} fontWeight="bold" lineHeight={1.2}>
              {t("Allocations")}
            </Heading>
            {invertedCreatedRounds && invertedCreatedRounds.length > maxRoundsToShow && showViewAll && (
              <Link asChild variant="plain" colorPalette="primary">
                <NextLink href="/rounds">
                  {t("See all rounds")}
                  <FiArrowUpRight />
                </NextLink>
              </Link>
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
            <Button size="md" variant="ghost" color="primary" onClick={loadMore}>
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
    loadMore,
    showViewAll,
    showLoadMore,
    renderRounds,
    t,
  ])

  return (
    <>
      {renderInsideCard ? (
        <Card.Root w="full" variant="baseWithBorder">
          <Card.Header>
            <HStack w="full" justify="space-between" alignItems={"baseline"}>
              <Heading size={["3xl", "4xl"]}>{t("Allocations")}</Heading>
              {invertedCreatedRounds && invertedCreatedRounds.length > maxRoundsToShow && showViewAll && (
                <Link asChild variant="plain" colorPalette="primary">
                  <NextLink href="/rounds">
                    {t("See all rounds")}
                    <FiArrowUpRight />
                  </NextLink>
                </Link>
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
