import { VStack, Spinner, HStack, Heading, Button, Card, Text, Center } from "@chakra-ui/react"
import dayjs from "dayjs"
import { Dispatch, SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import InfiniteScroll from "react-infinite-scroll-component"

import { useUsersB3trActions, UserB3trActions } from "../../../../../api/indexer/actions/useUsersB3trActions"
import { BetterActionCard } from "../../../../../components/TransactionCard/cards/BetterActionCard/BetterActionCard"

type Props = {
  setIsCalendarView: Dispatch<SetStateAction<boolean>>
  address: string
}
export const ActivityList = ({ address, setIsCalendarView }: Props) => {
  const { t } = useTranslation()
  const { data, fetchNextPage, hasNextPage } = useUsersB3trActions(address, { direction: "DESC" })
  const actions = data?.pages.map(page => page.data).flat() ?? []
  const handleSetCalendarView = () => {
    setIsCalendarView(true)
  }
  const groupActionsByDay = (actions: UserB3trActions) => {
    return actions.reduce<Record<string, UserB3trActions>>(
      (grouped, action) => {
        const day = dayjs.unix(action.blockTimestamp).format("YYYY-MM-DD")
        // Ensure the group for this day is initialized
        if (!grouped[day]) {
          grouped[day] = [] // This guarantees grouped[day] is always an array
        }
        // Now safely push into grouped[day]
        ;(grouped[day] as UserB3trActions).push(action)
        return grouped
      },
      {} as Record<string, UserB3trActions>,
    )
  }
  const groupedActions = groupActionsByDay(actions)
  return (
    <Card.Root w="full" variant="primary">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="baseline" mb={4}>
            <Heading size="md">{t("History")}</Heading>
            <Button variant="link" size="sm" h={"16px"} onClick={handleSetCalendarView}>
              {t("Change to calendar view")}
            </Button>
          </HStack>
          {actions.length === 0 ? (
            <Text>{t("No better actions found")}</Text>
          ) : (
            <InfiniteScroll
              dataLength={actions.length}
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              style={{ overflow: "hidden" }}
              loader={
                <Center>
                  <Spinner size="md" mt={4} alignSelf="center" />
                </Center>
              }>
              <VStack gap={6} align="stretch">
                {Object.entries(groupedActions).map(([day, dayActions]) => (
                  <VStack key={day} gap={3} align="stretch">
                    <Text fontWeight="semibold" color="#848484">
                      {dayjs(day).format("MMMM D YYYY").toUpperCase()}
                    </Text>
                    {dayActions.map(action => (
                      <BetterActionCard
                        key={`action-${day}-${action.appId}-${action.blockTimestamp}`}
                        amountB3tr={action.amount}
                        appId={action.appId}
                        blockNumber={action.blockNumber}
                        blockTimestamp={action.blockTimestamp}
                        proof={action.proof}
                      />
                    ))}
                  </VStack>
                ))}
              </VStack>
            </InfiniteScroll>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
