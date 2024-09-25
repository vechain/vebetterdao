import { SustainabilityActionsResponse, useSustainabilityActions } from "@/api"
import { BetterActionCard } from "@/components/Sustainability/BetterActionCard"
import { useWallet } from "@vechain/dapp-kit-react"
import InfiniteScroll from "react-infinite-scroll-component"
import { VStack, Spinner, HStack, Heading, Button, Card, CardBody, Text } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { Dispatch, SetStateAction } from "react"
import dayjs from "dayjs"

export const ActivityList = ({ setIsCalendarView }: { setIsCalendarView: Dispatch<SetStateAction<boolean>> }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data, fetchNextPage, hasNextPage } = useSustainabilityActions({
    wallet: account ?? undefined,
    direction: "desc",
  })

  const actions = data?.pages.map(page => page.data).flat() ?? []

  const handleSetCalendarView = () => {
    setIsCalendarView(true)
  }

  const groupActionsByDay = (actions: SustainabilityActionsResponse["data"]) => {
    const grouped: Record<string, SustainabilityActionsResponse["data"][number][]> = {}
    actions.forEach(action => {
      const day = dayjs.unix(action.blockTimestamp).format("YYYY-MM-DD")
      if (!grouped[day]) {
        grouped[day] = []
      }
      grouped[day].push(action)
    })
    return grouped
  }

  const groupedActions = groupActionsByDay(actions)

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="baseline" mb={4}>
            <Heading size="md">{t("Actions history")}</Heading>
            <Button variant="primaryLink" size="sm" h={"16px"} onClick={handleSetCalendarView}>
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
              loader={<Spinner size="md" alignSelf="center" />}>
              <VStack gap={6} align="stretch">
                {Object.entries(groupedActions).map(([day, dayActions]) => (
                  <VStack key={day} spacing={3} align="stretch">
                    <Text fontWeight="600" color="#848484">
                      {dayjs(day).format("MMMM D YYYY").toUpperCase()}
                    </Text>
                    {dayActions.map((action, index) => (
                      <BetterActionCard key={`${day}-${index}`} action={action} />
                    ))}
                  </VStack>
                ))}
              </VStack>
            </InfiniteScroll>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
