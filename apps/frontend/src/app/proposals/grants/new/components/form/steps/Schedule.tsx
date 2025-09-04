import { useCanProposalStartInNextRound, useCurrentAllocationsRoundDeadline, useCurrentAllocationsRoundId } from "@/api"
import { FormDateSelect } from "@/components/CustomFormFields"
import { useEstimateBlockTimestamp } from "@/hooks"
import { GrantFormData } from "@/hooks/proposals/grants/types"
import { Grid, GridItem, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useMemo } from "react"
import { Control, FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { CountdownBoxes } from "@/components"

interface ScheduleProps {
  register: UseFormRegister<GrantFormData>
  errors: FieldErrors<GrantFormData>
  control: Control<GrantFormData>
  watch: UseFormWatch<GrantFormData>
}
export const Schedule = ({ register, errors, control, watch }: ScheduleProps) => {
  const { t } = useTranslation()

  const { data: currentRoundId, isLoading: isCurrentRoundIdLoading } = useCurrentAllocationsRoundId()
  const { data: currentRoundDeadline } = useCurrentAllocationsRoundDeadline()
  const currentRoundDeadlineDate = useEstimateBlockTimestamp({ blockNumber: currentRoundDeadline })
  const { data: canStartInNextRound, isLoading: isCanStartInNextRoundLoading } = useCanProposalStartInNextRound()

  const options = useMemo(() => {
    if (
      currentRoundId === null ||
      currentRoundId === undefined ||
      canStartInNextRound === null ||
      canStartInNextRound === undefined
    )
      return []
    return Array.from({ length: 2 }, (_, index) => {
      const followingRoundId = Number(currentRoundId) + index + 1
      const followingRoundDeadlineDate = dayjs(currentRoundDeadlineDate).add(index, "week")
      const roundId = canStartInNextRound ? followingRoundId : followingRoundId + 1
      const roundStartDate = canStartInNextRound
        ? followingRoundDeadlineDate
        : dayjs(followingRoundDeadlineDate).add(1, "week")
      return {
        id: roundId,
        label: `${t("From today")}   - ${dayjs(roundStartDate).format("DD/MM/YYYY")}`,
        value: Number(roundId),
        canStart: canStartInNextRound,
        endDate: roundStartDate,
      }
    })
  }, [currentRoundId, canStartInNextRound, currentRoundDeadlineDate, t])

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
      <GridItem colSpan={4} alignSelf="center">
        <Skeleton loading={isCurrentRoundIdLoading || isCanStartInNextRoundLoading}>
          <FormDateSelect
            label={t("Date")}
            placeholder={t("Select date")}
            register={register("votingRoundId", { required: t("This field is required") })}
            options={options}
            control={control}
            error={errors.votingRoundId?.message}
            defaultValue={options[0]?.value}
          />
        </Skeleton>
      </GridItem>
      <GridItem colSpan={1}>
        <VStack align="start" gap={3}>
          <Text fontSize="sm" fontWeight="medium" color="text.subtle">
            {t("Support ends in")}
          </Text>
          <HStack gap={2} w="full">
            <CountdownBoxes days={daysLeft} hours={hoursLeft} minutes={minutesLeft} />
          </HStack>
        </VStack>
      </GridItem>
    </Grid>
  )
}
