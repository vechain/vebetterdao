import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react"
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Grid,
  Heading,
  HStack,
  Skeleton,
  Text,
  VStack,
  useMediaQuery,
} from "@chakra-ui/react"
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

export const ActivityCalendar = ({ setIsCalendarView }: { setIsCalendarView: Dispatch<SetStateAction<boolean>> }) => {
  const { t } = useTranslation()
  const today = dayjs()
  const [currentDate, setCurrentDate] = useState(today)
  const { activitiesPerDay, isLoading } = useActivities()
  const [isMobile] = useMediaQuery("(max-width: 600px)")

  const daysInMonth = currentDate.daysInMonth()
  const firstDayOfMonth = currentDate.startOf("month").day()

  const handleSetListView = useCallback(() => {
    setIsCalendarView(false)
  }, [setIsCalendarView])

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
    <Card w="full" variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" spacing={4}>
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
            <Button variant="ghost" size="sm" onClick={() => changeMonth(1)} isDisabled={isDisabledNextMonth}>
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
            {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map((_, index) => (
              <Box key={`empty-${index}`} h="10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1
              const activityLevel = getActivityLevel(day)
              const isFutureDay = today.isBefore(currentDate.date(day), "day")
              const isToday = today.isSame(currentDate.date(day), "day")
              if (isLoading) {
                return <Skeleton key={day} h="10" />
              }
              return (
                <Box key={day}>
                  <Button
                    w="full"
                    h="10"
                    isDisabled={isFutureDay}
                    variant="unstyled"
                    fontSize="sm"
                    fontWeight="medium"
                    bg={getActivityColor(activityLevel)}
                    color={getActivityFontColor(activityLevel)}
                    borderRadius="md"
                    border={isToday ? "2px solid #000" : "1px solid #dfdfdf"}
                    _hover={{ opacity: 0.8 }}>
                    {day}
                  </Button>
                </Box>
              )
            })}
          </Grid>
          <HStack justify="center" spacing={2} wrap="wrap">
            {legendItems.map(item => (
              <HStack key={item.label} spacing={1}>
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
      </CardBody>
    </Card>
  )
}
