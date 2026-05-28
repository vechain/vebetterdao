import {
  Box,
  Button,
  Field,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  InputGroup,
  Popover,
  Text,
  VStack,
  useBreakpointValue,
  useMediaQuery,
  InputProps,
  Icon,
} from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import dayjs from "dayjs"
import updateLocale from "dayjs/plugin/updateLocale"
import { useCallback, useEffect, useMemo, useState } from "react"
import { UseFormRegisterReturn, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"
import { LuCalendar } from "react-icons/lu"

/**
 * On non-mainnet envs we let testers pick a precise hour/minute (and "today") so a milestone can
 * start 5 minutes from now. Mainnet keeps date-only behaviour to avoid weird timezone surprises.
 */
const isTimeSelectionEnabled = (): boolean => {
  try {
    return getConfig().environment !== "mainnet"
  } catch {
    return false
  }
}
//TODO: This input needs a optimization, it's not efficient with those lots of calculations and state updates
// Starting the week on Monday
dayjs.extend(updateLocale)
dayjs.updateLocale("en", {
  weekStart: 1,
})
type CalendarHeaderProps = {
  currentDate: dayjs.Dayjs
  changeMonth: (increment: number) => void
  isPrevMonthDisabled: boolean
  isNextMonthDisabled: boolean
}
type CalendarBodyProps = {
  currentDate: dayjs.Dayjs
  daysInMonth: number
  firstDayOfMonth: number
  isDaySelectable: (day: number) => boolean
  isDaySelected: (day: number) => boolean
  handleDaySelect: (day: number) => void
  isMobile: boolean
  today: dayjs.Dayjs
  minDate?: number
  maxDate?: number
}

type CalendarFooterProps = {
  resetSelection: () => void
}

type FormDateInputProps = {
  label?: string
  description?: string
  placeholder?: string
  register: UseFormRegisterReturn
  error?: string
  onBlur?: () => void
  isOptional?: boolean
  // Date constraints in Unix seconds (to match GrantFormData schema)
  minDate?: number
  maxDate?: number
  size?: InputProps["size"]
  watch?: UseFormWatch<any>
}

const CalendarHeader = ({
  currentDate,
  changeMonth,
  isPrevMonthDisabled,
  isNextMonthDisabled,
}: CalendarHeaderProps) => {
  const monthName = currentDate.format("MMMM YYYY")

  return (
    <Flex justify="space-between" align="center">
      <Button variant="plain" size="sm" onClick={() => changeMonth(-1)} disabled={isPrevMonthDisabled}>
        <FaChevronLeft />
      </Button>
      <Heading size="md" textAlign="center">
        {monthName}
      </Heading>
      <Button variant="plain" size="sm" onClick={() => changeMonth(1)} disabled={isNextMonthDisabled}>
        <FaChevronRight />
      </Button>
    </Flex>
  )
}

const CalendarBody = ({
  currentDate,
  daysInMonth,
  firstDayOfMonth,
  isDaySelectable,
  isDaySelected,
  handleDaySelect,
  isMobile,
}: CalendarBodyProps) => {
  return (
    <Grid templateColumns="repeat(7, 1fr)" gap={1}>
      {/* Day Headers */}
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
        <Box key={day} textAlign="center">
          <Text textStyle="xs" color="#D9D9D9">
            {day}
          </Text>
        </Box>
      ))}

      {/* Empty cells for days before the first day of month */}
      {[...Array((firstDayOfMonth + 6) % 7)].map((_, i) => {
        const date = currentDate.startOf("month").subtract(((firstDayOfMonth + 6) % 7) - i, "day")
        return <Box key={`empty-${date.format("YYYY-MM-DD")}`} h="8" />
      })}

      {/* Calendar Days */}
      {Array.from({ length: daysInMonth }).map((_, index) => {
        const day = index + 1
        const isSelectable = isDaySelectable(day)
        const isSelected = isDaySelected(day)

        // A day is unavailable if it's not selectable
        const isUnavailable = !isSelectable
        const bgColor = isUnavailable ? "bg.subtle" : isSelected ? "actions.primary.default" : "transparent"
        const textColor = isUnavailable ? "text.subtle" : isSelected ? "white" : "inherit"
        const borderColor = isUnavailable ? "none" : isSelected ? "border.secondary" : "border.primary"
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
            textStyle={isMobile ? "2xs" : "xs"}
            bg={bgColor}
            color={textColor}
            borderRadius="md"
            border={isUnavailable ? "none" : "sm"}
            borderColor={borderColor}
            _hover={{ opacity: isSelectable ? 0.8 : 1 }}
            cursor={isUnavailable ? "not-allowed" : "pointer"}
            display="flex"
            alignItems="center"
            justifyContent="center">
            {day}
          </Button>
        )
      })}
    </Grid>
  )
}

const CalendarFooter = ({ resetSelection }: CalendarFooterProps) => {
  const { t } = useTranslation()

  return (
    <HStack justify="space-between">
      <Button size="sm" variant="primary" onClick={resetSelection}>
        {t("Clear")}
      </Button>
    </HStack>
  )
}

export const FormDateInput = ({
  label,
  description,
  placeholder = "Select date",
  register,
  error,
  onBlur,
  isOptional = false,
  minDate,
  maxDate,
  size = "md",
  watch,
}: FormDateInputProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile] = useMediaQuery(["(max-width: 768px)"])

  // Responsive placement based on screen size
  const placement = useBreakpointValue<"bottom-start" | undefined>({
    base: undefined,
    md: "bottom-start",
  })

  // Watch the form value if watch function is provided
  const formValue = watch ? watch(register.name) : undefined

  // Current view state
  const today = useMemo(() => dayjs(), [])
  const [currentDate, setCurrentDate] = useState(today)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const allowTime = useMemo(() => isTimeSelectionEnabled(), [])
  const [selectedHour, setSelectedHour] = useState(0)
  const [selectedMinute, setSelectedMinute] = useState(0)

  // Update selected date when form value changes
  // Convert from Unix timestamp (form value) back to display format
  useEffect(() => {
    if (formValue) {
      const d = dayjs.unix(formValue)
      setSelectedDate(d.format("YYYY-MM-DD"))
      if (allowTime) {
        setSelectedHour(d.hour())
        setSelectedMinute(d.minute())
      }
    } else {
      setSelectedDate("")
    }
  }, [formValue, allowTime])

  // Calendar calculations
  const daysInMonth = currentDate.daysInMonth()
  const firstDayOfMonth = currentDate.startOf("month").day()

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

      // Block past dates (before today)
      if (date.isBefore(today, "day")) {
        return false
      }

      // Block today (mainnet only — with time selection, "today + a few minutes" is the whole point)
      if (!allowTime && date.isSame(today, "day")) {
        return false
      }

      // Respect minDate constraint (but allow selection of minDate itself)
      if (minDate && date.isBefore(dayjs.unix(minDate), "day")) {
        return false
      }

      // Respect maxDate constraint (but allow selection of maxDate itself)
      if (maxDate && date.isAfter(dayjs.unix(maxDate), "day")) {
        return false
      }

      return true
    },
    [currentDate, maxDate, minDate, today, allowTime],
  )

  const commitTimestamp = useCallback(
    (dateStr: string, hour: number, minute: number) => {
      const unixSeconds = dayjs(dateStr).hour(hour).minute(minute).second(0).millisecond(0).unix()
      register.onChange({ target: { name: register.name, value: unixSeconds } })
    },
    [register],
  )

  const handleDaySelect = useCallback(
    (day: number) => {
      const selected = currentDate.date(day).format("YYYY-MM-DD")
      setSelectedDate(selected)
      commitTimestamp(selected, allowTime ? selectedHour : 0, allowTime ? selectedMinute : 0)

      // Keep the popover open when time selection is on so the tester can dial in hours/minutes.
      if (!allowTime) {
        setIsOpen(false)
        onBlur?.()
      }
    },
    [currentDate, commitTimestamp, allowTime, selectedHour, selectedMinute, onBlur],
  )

  const handleTimeChange = useCallback(
    (hour: number, minute: number) => {
      const safeHour = Math.max(0, Math.min(23, hour))
      const safeMinute = Math.max(0, Math.min(59, minute))
      setSelectedHour(safeHour)
      setSelectedMinute(safeMinute)
      if (selectedDate) commitTimestamp(selectedDate, safeHour, safeMinute)
    },
    [commitTimestamp, selectedDate],
  )

  const resetSelection = useCallback(() => {
    setSelectedDate("") // Clear display state
    // Set form value to 0 (Unix timestamp for "no date selected")
    const syntheticEvent = {
      target: {
        name: register.name,
        value: 0, // Unix timestamp: 0 = no date selected
      },
    }
    register.onChange(syntheticEvent)
  }, [register])

  // Display value for the input field (formatted for user readability)
  // Note: This is only for visual display - the actual form value remains as Unix timestamp
  const displayValue = useMemo(() => {
    if (!selectedDate) return ""
    const d = dayjs(selectedDate).hour(selectedHour).minute(selectedMinute)
    return allowTime ? d.format("MM/DD/YYYY HH:mm") : d.format("MM/DD/YYYY")
  }, [selectedDate, selectedHour, selectedMinute, allowTime])

  const isDaySelected = useCallback(
    (day: number) => {
      const date = currentDate.date(day).format("YYYY-MM-DD")
      return date === selectedDate
    },
    [currentDate, selectedDate],
  )

  // Check if next month button should be disabled
  const isNextMonthDisabled = useMemo(() => {
    if (!maxDate) return false
    return currentDate.add(1, "month").isAfter(dayjs.unix(maxDate), "month")
  }, [currentDate, maxDate])

  // Check if previous month button should be disabled
  const isPrevMonthDisabled = useMemo(() => {
    if (!minDate) return false
    return currentDate.subtract(1, "month").isBefore(dayjs.unix(minDate), "month")
  }, [currentDate, minDate])

  return (
    <Field.Root invalid={!!error}>
      {/* Always render label container for consistent alignment */}
      <HStack justify="space-between" w="full" minH="5" mb={description ? 0 : 2}>
        {label ? (
          <Field.Label textStyle="sm" htmlFor={register.name}>
            {label}
          </Field.Label>
        ) : (
          <Box /> // Empty box to maintain space
        )}
        {isOptional && (
          <Text textStyle="sm" color="text.subtle">
            {"Optional"}
          </Text>
        )}
      </HStack>
      {description && (
        <Text textStyle="xs" color="gray.500" mb={2}>
          {description}
        </Text>
      )}

      <Popover.Root
        open={isOpen}
        onOpenChange={details => setIsOpen(details.open)}
        positioning={{ strategy: "fixed", placement }}
        closeOnInteractOutside={true}>
        <Popover.Trigger w="full">
          <InputGroup
            w="full"
            startElement={<Icon as={LuCalendar} color="icon.subtle" />}
            startElementProps={{
              h: "50%",
              color: "text.default",
              textStyle: "md",
              pl: "3",
            }}>
            <Input
              p="3"
              size={size}
              placeholder={placeholder}
              value={displayValue}
              readOnly
              onClick={() => setIsOpen(!isOpen)}
              cursor="pointer"
              rounded="xl"
              name={register.name}
              ref={register.ref}
              style={{ paddingInlineStart: "2rem" }}
            />
          </InputGroup>
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content width={isMobile ? "280px" : "320px"} boxShadow="lg">
            <Popover.Arrow />
            <Popover.Body p={isMobile ? 2 : 4}>
              <VStack gap={isMobile ? 2 : 4} align="stretch">
                <CalendarHeader
                  currentDate={currentDate}
                  changeMonth={changeMonth}
                  isPrevMonthDisabled={isPrevMonthDisabled}
                  isNextMonthDisabled={isNextMonthDisabled}
                />

                <CalendarBody
                  currentDate={currentDate}
                  daysInMonth={daysInMonth}
                  firstDayOfMonth={firstDayOfMonth}
                  isDaySelectable={isDaySelectable}
                  isDaySelected={isDaySelected}
                  handleDaySelect={handleDaySelect}
                  isMobile={!!isMobile}
                  today={today}
                  minDate={minDate}
                />

                {allowTime && (
                  <HStack gap={2} align="center">
                    <Text textStyle="sm" color="text.subtle">
                      {"Time"}
                    </Text>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      step={1}
                      inputMode="numeric"
                      value={selectedHour.toString().padStart(2, "0")}
                      onChange={e => handleTimeChange(Number(e.target.value), selectedMinute)}
                      w="14"
                      size="sm"
                      rounded="md"
                      textAlign="center"
                    />
                    <Text>{":"}</Text>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      step={1}
                      inputMode="numeric"
                      value={selectedMinute.toString().padStart(2, "0")}
                      onChange={e => handleTimeChange(selectedHour, Number(e.target.value))}
                      w="14"
                      size="sm"
                      rounded="md"
                      textAlign="center"
                    />
                    <Button
                      size="sm"
                      variant="primary"
                      ml="auto"
                      onClick={() => {
                        setIsOpen(false)
                        onBlur?.()
                      }}>
                      {"Done"}
                    </Button>
                  </HStack>
                )}

                <CalendarFooter resetSelection={resetSelection} />
              </VStack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>

      {error && <Field.ErrorText>{error}</Field.ErrorText>}
    </Field.Root>
  )
}
