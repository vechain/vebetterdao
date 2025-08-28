import { Grid, GridItem, HStack, Text, Skeleton, VStack, Card } from "@chakra-ui/react"
import { Control, FieldErrors, UseFormRegister } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { useCanProposalStartInNextRound, useCurrentAllocationsRoundDeadline, useCurrentAllocationsRoundId } from "@/api"
import { useMemo } from "react"
import dayjs from "dayjs"
import { useEstimateBlockTimestamp } from "@/hooks"
import { FormDateSelect } from "@/components/CustomFormFields"

//TODO: Move to shared component
type CountdownUnitProps = {
  value: number
  label: string
}

const CountdownUnit = ({ value, label }: CountdownUnitProps) => {
  return (
    <Card.Root variant="filledSmall" w="full">
      <Card.Body textAlign="center">
        <Text fontSize="lg" fontWeight="bold">
          {Math.max(0, value)}
        </Text>
        <Text fontSize="xs" color="text.subtle" textAlign="center">
          {label}
        </Text>
      </Card.Body>
    </Card.Root>
  )
}

interface ScheduleProps {
  register: UseFormRegister<GrantFormData>
  errors: FieldErrors<GrantFormData>
  control: Control<GrantFormData>
}
export const Schedule = ({ register, errors, control }: ScheduleProps) => {
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
        value: roundId,
        canStart: canStartInNextRound,
      }
    })
  }, [currentRoundId, canStartInNextRound, currentRoundDeadlineDate, t])

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
            register={register("supportDeadline")}
            options={options}
            control={control}
            error={errors.supportDeadline?.message}
          />
        </Skeleton>
      </GridItem>
      <GridItem colSpan={1}>
        <VStack align="start" gap={3}>
          <Text fontSize="sm" fontWeight="medium" color="text.subtle">
            {t("Support ends in")}
          </Text>
          <HStack gap={2} w="full">
            <CountdownUnit value={dayjs(currentRoundDeadlineDate).diff(dayjs(), "days")} label="Days" />
            <CountdownUnit value={dayjs(currentRoundDeadlineDate).diff(dayjs(), "hours") % 24} label="Hours" />
          </HStack>
        </VStack>
      </GridItem>
    </Grid>
  )
}
