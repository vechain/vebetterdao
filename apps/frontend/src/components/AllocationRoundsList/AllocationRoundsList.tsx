import { Alert, Box, Button, Card, HStack, Heading, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiArrowUpRight } from "react-icons/fi"

import { useAllocationsRoundsEvents } from "../../api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"

import { AllocationRoundCard } from "./components/AllocationRoundCard"

type Props = {
  maxRoundsToShow?: number
  showLoadMore?: boolean
  showViewAll?: boolean
}
export const AllocationRoundsList: React.FC<Props> = ({
  maxRoundsToShow = 3,
  showLoadMore = false,
  showViewAll = true,
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
            <Button size="md" variant="link" onClick={loadMore}>
              {t("Load more")}
            </Button>
          )}
        </VStack>
      </VStack>
    )
  }, [allocationRoundEventsError, totalRoundsToShow, invertedCreatedRounds, loadMore, showLoadMore, renderRounds, t])

  return (
    <Card.Root w="full" variant="primary">
      <Card.Header>
        <HStack w="full" justify="space-between" alignItems={"baseline"}>
          <Heading size={["xl", "2xl"]}>{t("Allocations")}</Heading>
          {invertedCreatedRounds && invertedCreatedRounds.length > maxRoundsToShow && showViewAll && (
            <Button asChild variant="link" textStyle="sm">
              <NextLink href="/allocations/history">
                {t("See all rounds")}
                <FiArrowUpRight />
              </NextLink>
            </Button>
          )}
        </HStack>
      </Card.Header>
      <Card.Body>{renderList}</Card.Body>
    </Card.Root>
  )
}
