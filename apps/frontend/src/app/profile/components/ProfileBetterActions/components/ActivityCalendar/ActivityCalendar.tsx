import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react"
import { Box, Button, Card, Flex, Grid, Heading, HStack, Skeleton, Text, VStack, useMediaQuery } from "@chakra-ui/react"
import dayjs from "dayjs"
import updateLocale from "dayjs/plugin/updateLocale"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { ActivityDayModal } from "../../ActivityDayModal"
import { useSustainabilitySingleUserOverviewByDay } from "@/api"
import { v4 as uuid } from "uuid"
// configure dayjs to start the week on Monday
dayjs.extend(updateLocale)
dayjs.updateLocale("en", {
  weekStart: 1,
})

type Props = {
  address: string
  setIsCalendarView: Dispatch<SetStateAction<boolean>>
}
export const ActivityCalendar = ({ address, setIsCalendarView }: Props) => {
  const { t } = useTranslation()
  const today = dayjs()
  const [currentDate, setCurrentDate] = useState(today)
  const [isMobile] = useMediaQuery(["(max-width: 600px)"])

  const daysInMonth = currentDate.daysInMonth()
  const firstDayOfMonth = currentDate.startOf("month").day()

  const [selectedDate, setSelectedDate] = useState<string>()

  const startDate = currentDate.startOf("month").format("YYYY-MM-DD")
  const endDate = currentDate.endOf("month").format("YYYY-MM-DD")

  const currentMonthOverviewQuery = useSustainabilitySingleUserOverviewByDay({
    wallet: address ?? "",
    startDate,
    endDate,
  })

  useEffect(() => {
    // Fetch until there are no more pages left
    const fetchAllPages = async () => {
      while (currentMonthOverviewQuery.hasNextPage && !currentMonthOverviewQuery.isFetchingNextPage) {
        await currentMonthOverviewQuery.fetchNextPage()
      }
    }

    fetchAllPages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate.toString()])

  const currentMonthOverview = useMemo(
    () => currentMonthOverviewQuery.data?.pages.flatMap(page => page.data) ?? [],
    [currentMonthOverviewQuery],
  )

  const handleSetListView = useCallback(() => {
    setIsCalendarView(false)
  }, [setIsCalendarView])

  const changeMonth = useCallback(
    (increment: number) => {
      setCurrentDate(currentDate.add(increment, "month"))
    },
    [currentDate],
  )

  const getActivityNumber = useCallback(
    (day: number) => {
      const dateString = currentDate.date(day).format("YYYY-MM-DD")
      return currentMonthOverview.find(overview => overview.date === dateString)?.actionsRewarded ?? 0
    },
    [currentMonthOverview, currentDate],
  )

  const getActivityColor = useCallback((level: number) => {
    if (level > 5) return "#577E2E"
    if (level >= 4) return "#93CB57"
    if (level >= 2) return "#B1F16C"
    if (level >= 1) return "#D0F7A7"
    return "#F0F0F0" // Light gray for no activity
  }, [])

  const getActivityFontColor = useCallback((level: number) => {
    if (level > 5) {
      return "white"
    }
    return "black"
  }, [])

  const isDisabledNextMonth = useMemo(() => {
    return currentDate.add(1, "month").isAfter(today, "month")
  }, [currentDate, today])

  // Define the legend items with minimal labels
  const legendItems = [
    { label: "0", color: "#F0F0F0" },
    { label: "1", color: "#D0F7A7" },
    { label: "2-3", color: "#B1F16C" },
    { label: "4-5", color: "#93CB57" },
    { label: "6+", color: "#577E2E" },
  ]

  return (
    <>
      <ActivityDayModal
        address={address}
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(undefined)}
        date={selectedDate}
      />
      <Card.Root w="full" variant="baseWithBorder">
        <Card.Body>
          <VStack align="stretch" gap={4}>
            <Flex justify="space-between" align="center">
              <Heading size="md">{t("Actions History")}</Heading>
              <Button variant="primaryLink" size="sm" onClick={handleSetListView}>
                {t("List View")}
              </Button>
            </Flex>

            <Flex justify="space-between" align="center">
              <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}>
                <FaChevronLeft />
              </Button>
              <Heading size="sm" textAlign="center">
                {currentDate.format("MMMM YYYY").toUpperCase()}
              </Heading>
              <Button variant="ghost" size="sm" onClick={() => changeMonth(1)} disabled={isDisabledNextMonth}>
                <FaChevronRight />
              </Button>
            </Flex>

            <Grid templateColumns="repeat(7, 1fr)" gap={1}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <Box key={day} textAlign="center">
                  <Text fontSize="xs" fontWeight="medium" color="gray.500">
                    {day}
                  </Text>
                </Box>
              ))}
              {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map(() => (
                <Box key={`empty-${uuid()}`} h="10" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1
                const activityNumber = getActivityNumber(day)
                const isFutureDay = today.isBefore(currentDate.date(day), "day")
                const isToday = today.isSame(currentDate.date(day), "day")

                const isDisabled = isFutureDay || currentMonthOverviewQuery.isLoading || activityNumber === 0

                return (
                  <Skeleton key={day} h="10" loading={currentMonthOverviewQuery.isLoading}>
                    <Button
                      key={day}
                      onClick={() => setSelectedDate(currentDate.date(day).format("YYYY-MM-DD"))}
                      w="full"
                      disabled={isDisabled}
                      variant="unstyled"
                      fontSize="sm"
                      fontWeight="medium"
                      bg={getActivityColor(activityNumber)}
                      color={getActivityFontColor(activityNumber)}
                      borderRadius="md"
                      border={isToday ? "2px solid #000" : "1px solid #dfdfdf"}
                      _hover={{ opacity: isDisabled ? 1 : 0.8 }}>
                      {day}
                    </Button>
                  </Skeleton>
                )
              })}
            </Grid>
            <HStack justify="center" gap={2} wrap="wrap">
              {legendItems.map(item => (
                <HStack key={item.label} gap={1}>
                  <Box w={4} h={4} bg={item.color} borderRadius="md" border="1px solid #ccc" />

                  <Text fontSize="xs" color="gray.600">
                    {item.label}
                  </Text>
                </HStack>
              ))}
              {!isMobile && (
                <Text fontSize="xs" color="gray.600">
                  {t("activities")}
                </Text>
              )}
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </>
  )
}
