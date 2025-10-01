import { useCanProposalStartInNextRound, useCurrentAllocationsRoundDeadline, useCurrentAllocationsRoundId } from "@/api"
import { GenericAlert } from "@/app/components/Alert"
import { CountdownBoxes } from "@/components"
import { FormSelect } from "@/components/CustomFormFields"
import { useEstimateBlockTimestamp } from "@/hooks"
import { GrantFormData } from "@/hooks/proposals/grants/types"
import { Grid, GridItem, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Calendar } from "iconoir-react"
import dayjs from "dayjs"
import { useCallback, useMemo } from "react"
import { Control, FieldErrors, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

const FEW_DAYS_LEFT_THRESHOLD = 4
interface ScheduleProps {
  errors: FieldErrors<GrantFormData>
  control: Control<GrantFormData>
  watch: UseFormWatch<GrantFormData>
  setData: (data: Partial<GrantFormData>) => void
}
type Option = {
  id: number
  label: string
  value: number
  endDate: dayjs.Dayjs
}
export const Schedule = ({ errors, control, watch, setData }: ScheduleProps) => {
  const { t } = useTranslation()

  const { data: currentRoundId, isLoading: isCurrentRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: currentRoundDeadline } = useCurrentAllocationsRoundDeadline()
  const currentRoundDeadlineDate = useEstimateBlockTimestamp({ blockNumber: currentRoundDeadline })
  const { data: canStartInNextRound, isLoading: isCanStartInNextRoundLoading } = useCanProposalStartInNextRound()

  const options = useMemo(() => {
    if (!currentRoundId) return []

    const optionsArray: Option[] = []
    const baseRoundId = Number(currentRoundId)
    // Options:

    //(if proposal can start in next round)
    // Option 1: Current round + 1
    // Option 2: Current round + 2

    //(if proposal can't start in next round)
    // Option 1: Current round + 2
    // Option 2: Current round + 3

    Array.from({ length: 2 }, (_, index) => {
      const incrementFactor = canStartInNextRound ? index + 1 : index + 2
      const roundId = baseRoundId + incrementFactor
      const deadline = dayjs(currentRoundDeadlineDate).add(incrementFactor, "week")
      optionsArray.push({
        id: roundId,
        label: `${t("From today")} - ${deadline.format("DD/MM/YYYY")}`,
        value: roundId,
        endDate: deadline,
      })
    })

    return optionsArray
  }, [currentRoundId, canStartInNextRound, currentRoundDeadlineDate, t])

  // Format options for FormSelect component
  const formSelectOptions = useMemo(() => {
    return options.map(option => ({
      label: option.label,
      value: option.value,
    }))
  }, [options])

  // Watch the selected value
  const selectedRoundId = watch("votingRoundId")

  // Find selected option for countdown calculation
  const selectedOption = useMemo(() => {
    return options.find(option => option.value === Number(selectedRoundId))
  }, [options, selectedRoundId])

  // Calculate countdown based on selected option
  const countdownDate = selectedOption?.endDate || currentRoundDeadlineDate
  const daysLeft = dayjs(countdownDate).diff(dayjs(), "days")
  const hoursLeft = dayjs(countdownDate).diff(dayjs(), "hours") % 24
  const minutesLeft = dayjs(countdownDate).diff(dayjs(), "minutes") % 60

  const hasFewDaysLeft = useMemo(() => {
    return countdownDate && daysLeft <= FEW_DAYS_LEFT_THRESHOLD
  }, [countdownDate, daysLeft])

  const handleVotingRoundChange = useCallback(
    (value: string | number) => {
      setData({ votingRoundId: String(value) })
    },
    [setData],
  )

  return (
    <Grid templateColumns={{ base: 5, md: 5 }} w="full" gap={6}>
      <GridItem colSpan={5}>
        <Text fontSize="lg" fontWeight="semibold">
          {t("Support deadline")}
        </Text>
        <Text fontSize="sm" color="text.subtle">
          {t("Choose when support phase for your Grant must end.")}
        </Text>
      </GridItem>
      <GridItem colSpan={{ base: 5, md: 4 }}>
        <Skeleton loading={isCurrentRoundIdLoading || isCanStartInNextRoundLoading}>
          <FormSelect
            name="votingRoundId"
            control={control}
            isRequired
            label={t("Date")}
            placeholder={t("Select date")}
            options={formSelectOptions}
            defaultValue={formSelectOptions?.[0]?.value}
            error={errors.votingRoundId?.message}
            onValueChange={handleVotingRoundChange}
            leftIcon={Calendar}
          />
        </Skeleton>
      </GridItem>
      <GridItem colSpan={{ base: 5, md: 1 }}>
        <VStack align="start" gap={3}>
          <Text fontSize="sm" fontWeight="medium" color="text.subtle">
            {t("Support ends in")}
          </Text>
          <HStack gap={2} w="full">
            <CountdownBoxes
              days={daysLeft}
              hours={hoursLeft}
              minutes={minutesLeft}
              {...(hasFewDaysLeft ? { bgColor: "warning.subtle" } : {})}
            />
          </HStack>
        </VStack>
      </GridItem>
      {hasFewDaysLeft && (
        <GridItem colSpan={5}>
          <GenericAlert
            isLoading={false}
            message={t(
              "Heads up: There will be not much time left to reach 3.5M VOT3 in support phase. You can either push the deadline or come back to publish your Grant on Monday.",
            )}
            type="warning"
          />
        </GridItem>
      )}
    </Grid>
  )
}
