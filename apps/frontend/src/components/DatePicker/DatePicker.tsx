import { useCallback, useMemo, useState } from "react"
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  InputGroup,
  Popover,
  Text,
  VStack,
  useMediaQuery,
  useBreakpointValue,
} from "@chakra-ui/react"
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { useTranslation } from "react-i18next"
import dayjs from "dayjs"
import updateLocale from "dayjs/plugin/updateLocale"

// Starting the week on Monday
dayjs.extend(updateLocale)
dayjs.updateLocale("en", {
  weekStart: 1,
})

export type DatePickerProps = {
  // Start date in ISO format (YYYY-MM-DD)
  startDate?: string
  // End date in ISO format (YYYY-MM-DD)
  endDate?: string
  onChange: (startDate: string, endDate: string) => void
  // Maximum selectable date
  maxDate?: string
  // Minimum selectable date
  minDate?: string
  // Input size
  size?: "sm" | "md" | "lg"
}

export const DatePicker = ({
  startDate = "",
  endDate = "",
  onChange,
  maxDate,
  minDate,
  size = "md",
}: DatePickerProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile] = useMediaQuery(["(max-width: 768px)"])

  // Responsive placement based on screen size
  const placement = useBreakpointValue<"right-end" | undefined>({
    base: undefined,
    md: "right-end",
  })

  // Current view state
  const today = useMemo(() => dayjs(), [])
  const [currentDate, setCurrentDate] = useState(today)
  const [selectionState, setSelectionState] = useState<"start" | "end">("start")
  const [tempStartDate, setTempStartDate] = useState(startDate)
  const [tempEndDate, setTempEndDate] = useState(endDate)

  // Calendar calculations
  const daysInMonth = currentDate.daysInMonth()
  const firstDayOfMonth = currentDate.startOf("month").day()
  const monthName = currentDate.format("MMMM YYYY")

  // Handle month navigation
  const changeMonth = useCallback(
    (increment: number) => {
      setCurrentDate(currentDate.add(increment, "month"))
    },
    [currentDate],
  )

  // Check if a day is selectable
  const isDaySelectable = useCallback(
    (day: number) => {
      const date = currentDate.date(day)

      if (minDate && date.isBefore(dayjs(minDate), "day")) {
        return false
      }

      if (maxDate && date.isAfter(dayjs(maxDate), "day")) {
        return false
      }

      return true
    },
    [currentDate, maxDate, minDate],
  )

  const handleDaySelect = useCallback(
    (day: number) => {
      const selectedDate = currentDate.date(day).format("YYYY-MM-DD")

      if (selectionState === "start") {
        setTempStartDate(selectedDate)
        setTempEndDate("")
        setSelectionState("end")
      } else {
        // Swap end date if it's before start date
        const startTimestamp = dayjs(tempStartDate).valueOf()
        const selectedTimestamp = dayjs(selectedDate).valueOf()

        if (selectedTimestamp < startTimestamp) {
          setTempEndDate(tempStartDate)
          setTempStartDate(selectedDate)
        } else {
          setTempEndDate(selectedDate)
        }

        setIsOpen(false)
        setSelectionState("start")

        // Applying the selected date
        onChange(
          selectedTimestamp < startTimestamp ? selectedDate : tempStartDate,
          selectedTimestamp < startTimestamp ? tempStartDate : selectedDate,
        )
      }
    },
    [currentDate, selectionState, tempStartDate, onChange],
  )

  const resetSelection = useCallback(() => {
    setTempStartDate("")
    setTempEndDate("")
    setSelectionState("start")
    onChange("", "")
  }, [onChange])

  const cancelSelection = useCallback(() => {
    setTempStartDate(startDate)
    setTempEndDate(endDate)
    setSelectionState("start")
    setIsOpen(false)
  }, [startDate, endDate])

  const displayValue = useMemo(() => {
    if (!startDate && !endDate) return ""
    if (startDate && !endDate) return dayjs(startDate).format("D MMM, YYYY")
    return `${dayjs(startDate).format("D MMM, YYYY")} - ${dayjs(endDate).format("D MMM, YYYY")}`
  }, [startDate, endDate])

  const isDayInRange = useCallback(
    (day: number) => {
      if (!tempStartDate || !tempEndDate) return false

      const date = currentDate.date(day).format("YYYY-MM-DD")
      return date > tempStartDate && date < tempEndDate
    },
    [currentDate, tempStartDate, tempEndDate],
  )

  const isDayStartOrEnd = useCallback(
    (day: number) => {
      const date = currentDate.date(day).format("YYYY-MM-DD")
      return date === tempStartDate || date === tempEndDate
    },
    [currentDate, tempStartDate, tempEndDate],
  )

  // Check if next month button should be disabled
  const isNextMonthDisabled = useMemo(() => {
    if (!maxDate) return false
    return currentDate.add(1, "month").isAfter(dayjs(maxDate), "month")
  }, [currentDate, maxDate])

  // Check if previous month button should be disabled
  const isPrevMonthDisabled = useMemo(() => {
    if (!minDate) return false
    return currentDate.subtract(1, "month").isBefore(dayjs(minDate), "month")
  }, [currentDate, minDate])

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={details => setIsOpen(details.open)}
      positioning={{ strategy: "fixed", placement }}
      closeOnInteractOutside={false}
      // modifiers={[
      //   {
      //     name: "flip",
      //     options: {
      //       fallbackPlacements: ["top", "bottom", "right", "left"],
      //     },
      //   },
      //   {
      //     name: "preventOverflow",
      //     options: {
      //       padding: 8,
      //     },
      //   },
      // ]}
    >
      <Popover.Trigger>
        <InputGroup w="full" startElement={<FaCalendarAlt color="contrast-fg-on-muted" pointerEvents="none" />}>
          <Input
            size={size}
            placeholder={t("Select date range")}
            value={displayValue}
            readOnly
            onClick={() => setIsOpen(!isOpen)}
            cursor="pointer"
            borderRadius="md"
          />
        </InputGroup>
      </Popover.Trigger>
      <Popover.Content width={isMobile ? "280px" : "320px"} boxShadow="lg">
        <Popover.Arrow />
        <Popover.Body p={isMobile ? 2 : 4}>
          <VStack gap={isMobile ? 2 : 4} align="stretch">
            {/* Calendar Header */}
            <Flex justify="space-between" align="center">
              <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)} disabled={isPrevMonthDisabled}>
                <FaChevronLeft />
              </Button>
              <Heading size="md" textAlign="center">
                {monthName.toUpperCase()}
              </Heading>
              <Button variant="ghost" size="sm" onClick={() => changeMonth(1)} disabled={isNextMonthDisabled}>
                <FaChevronRight />
              </Button>
            </Flex>

            {/* Day Headers */}
            <Grid templateColumns="repeat(7, 1fr)" gap={1}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <Box key={day} textAlign="center">
                  <Text fontSize="xs" fontWeight="medium" color="#D9D9D9">
                    {day}
                  </Text>
                </Box>
              ))}

              {/* Empty cells for days before the first day of month with a random key */}
              {[...Array((firstDayOfMonth + 6) % 7)].map((_, i) => {
                const date = currentDate.startOf("month").subtract(((firstDayOfMonth + 6) % 7) - i, "day")
                return <Box key={`empty-${date.format("YYYY-MM-DD")}`} h="8" />
              })}

              {/* Calendar Days */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1
                const isSelectable = isDaySelectable(day)
                const isInRange = isDayInRange(day)
                const isStartOrEnd = isDayStartOrEnd(day)
                const isToday = today.isSame(currentDate.date(day), "day")

                return (
                  <Button
                    key={`day-${day}`}
                    onClick={() => isSelectable && handleDaySelect(day)}
                    w="full"
                    h={isMobile ? "7" : "8"}
                    minW="0"
                    p="0"
                    disabled={!isSelectable}
                    unstyled
                    fontSize={isMobile ? "2xs" : "xs"}
                    fontWeight="medium"
                    bg={isStartOrEnd ? "#004CFC" : isInRange ? "#E0E9FE" : "transparent"}
                    color={isStartOrEnd ? "white" : "inherit"}
                    borderRadius="md"
                    border={isToday ? "2px solid #000" : "1px solid #dfdfdf"}
                    _hover={{ opacity: isSelectable ? 0.8 : 1 }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center">
                    {day}
                  </Button>
                )
              })}
            </Grid>

            <HStack justify="space-between">
              <Button size="sm" variant="ghost" onClick={resetSelection}>
                {t("Clear")}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelSelection}>
                {t("Cancel")}
              </Button>
            </HStack>

            {/* Reminder to select an end date */}
            {tempStartDate && !tempEndDate && (
              <Text fontSize="xs" color="#D9D9D9" textAlign="center">
                {t("Select end date")}
              </Text>
            )}
          </VStack>
        </Popover.Body>
      </Popover.Content>
    </Popover.Root>
  )
}
