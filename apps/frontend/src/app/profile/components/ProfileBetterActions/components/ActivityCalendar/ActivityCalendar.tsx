import { useCallback, useMemo, useState } from "react"
import { Box, Button, Card, CardBody, Flex, Grid, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import updateLocale from "dayjs/plugin/updateLocale"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
import { useTranslation } from "react-i18next"
import { useActivities } from "./useActivities"

// configure dayjs to start the week on Monday
dayjs.extend(updateLocale)
dayjs.updateLocale("en", {
  weekStart: 1,
})

export const ActivityCalendar = () => {
  const { t } = useTranslation()
  const today = dayjs()
  const [currentDate, setCurrentDate] = useState(today)
  const { activitiesPerDay, isLoading } = useActivities()

  const daysInMonth = currentDate.daysInMonth()
  const firstDayOfMonth = currentDate.startOf("month").day()

  const changeMonth = useCallback(
    (increment: number) => {
      setCurrentDate(currentDate.add(increment, "month"))
    },
    [currentDate],
  )

  const getActivityLevel = useCallback(
    (day: number) => {
      const dateString = currentDate.date(day).format("YYYY-MM-DD")
      return activitiesPerDay[dateString] || 0
    },
    [activitiesPerDay, currentDate],
  )

  const getActivityColor = useCallback((level: number) => {
    if (level === 0) {
      return "transparent"
    }
    if (level === 1) {
      return "#dce8fd"
    }
    if (level === 2 || level === 3) {
      return "#60a5fa"
    }
    if (level === 4 || level === 5) {
      return "#225eec"
    }
    return "#203a87"
  }, [])

  const getActivityFontColor = useCallback((level: number) => {
    if (level > 1) {
      return "white"
    }
    return "black"
  }, [])

  const isDisabledNextMonth = useMemo(() => {
    return currentDate.add(1, "month").isAfter(today, "month")
  }, [currentDate, today])

  return (
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="center" mb={4}>
            <Heading size="md">{t("Actions history")}</Heading>
            <Button variant="primaryLink" size="sm" h={"16px"}>
              {t("Change to list view")}
            </Button>
          </HStack>

          <Flex justify="space-between" align="center" mb={4}>
            <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)}>
              <FaChevronLeft />
            </Button>
            <Heading size="sm">{currentDate.format("MMMM YYYY").toUpperCase()}</Heading>
            <Button variant="ghost" size="sm" onClick={() => changeMonth(1)} isDisabled={isDisabledNextMonth}>
              <FaChevronRight />
            </Button>
          </Flex>
          <Grid templateColumns="repeat(7, 1fr)" gap={1}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
              <Box key={day} textAlign="center">
                <Text fontSize="sm" fontWeight="medium" color="gray.500">
                  {day}
                </Text>
              </Box>
            ))}
            {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map((_, index) => (
              <Box key={`empty-${index}`} h="10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1
              const activityLevel = getActivityLevel(day)
              const isFutureDay = today.isBefore(currentDate.date(day))
              const isToday = today.isSame(currentDate.date(day), "day")
              if (isLoading) {
                return <Skeleton key={day} h="10" />
              }
              return (
                <Flex
                  key={day}
                  h="10"
                  align="center"
                  justify="center"
                  bg={getActivityColor(activityLevel)}
                  color={getActivityFontColor(activityLevel)}
                  borderRadius="md"
                  opacity={isFutureDay ? 0.5 : 1}
                  border={"1px solid"}
                  borderColor={isToday ? "black" : "#dfdfdf"}>
                  <Text fontSize="sm" fontWeight="medium">
                    {day}
                  </Text>
                </Flex>
              )
            })}
          </Grid>
        </VStack>
      </CardBody>
    </Card>
  )
}
