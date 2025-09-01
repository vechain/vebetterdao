import {
  Text,
  Grid,
  GridItem,
  Heading,
  List,
  Button,
  Icon,
  Accordion,
  Badge,
  HStack,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues, UseFormWatch, Control } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { FormItem } from "@/components/CustomFormFields/FormItem"
import { FormDateInput } from "@/components/CustomFormFields/FormDateInput"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { UilPlus, UilTrash, UilArrowRight } from "@iconscout/react-unicons"
import { FormCheckbox } from "@/components/CustomFormFields/FormCheckbox"
import dayjs from "dayjs"
import { useMilestoneMinimumAmount } from "@/hooks/proposals/grants"

interface MilestonesProps {
  register: UseFormRegister<GrantFormData>
  setValue: UseFormSetValue<GrantFormData>
  getValues: UseFormGetValues<GrantFormData>
  errors: FieldErrors<GrantFormData>
  setData: (data: GrantFormData) => void
  formData: GrantFormData
  watch: UseFormWatch<GrantFormData>
  control: Control<GrantFormData>
}

type MilestoneSectionProps = {
  register: UseFormRegister<GrantFormData>
  errors: FieldErrors<GrantFormData>
  index: number
  removeMilestone: (index: number) => void
  getValues: UseFormGetValues<GrantFormData>
  watch: UseFormWatch<GrantFormData>
}

export const MilestoneSection = ({
  register,
  errors,
  index,
  removeMilestone,
  getValues,
  watch,
}: MilestoneSectionProps) => {
  const { t } = useTranslation()
  const { data: milestoneMinimumAmount } = useMilestoneMinimumAmount()
  const milestoneNumber = index + 1
  const isFirst = index === 0
  const [isMobile] = useMediaQuery(["(max-width: 767px)"])

  const now = dayjs().unix()
  const canRemoveAnyMilestone = milestoneNumber > (milestoneMinimumAmount ?? 0)
  const formatDuration = (duration: number | string) => {
    const durationInMiliseconds = Number(duration) * 1000 //Convert to miliseconds
    return dayjs(durationInMiliseconds).format("MM/DD/YYYY")
  }

  const currentMilestone = getValues(`milestones.${index}`)
  const hasDurationInfo = currentMilestone.durationFrom > 0 && currentMilestone.durationTo > 0
  const formattedDurationFrom = formatDuration(currentMilestone.durationFrom)
  const formattedDurationTo = formatDuration(currentMilestone.durationTo)

  return (
    <Accordion.Item key={index} value={`milestone-${index}`} {...(isFirst && { borderTop: "none" })}>
      <Accordion.ItemTrigger w="full" py={4} textAlign="left" justifyContent="space-between">
        <HStack w="full" gap={4}>
          <Heading size="md">{t("Milestone {{milestoneNumber}}", { milestoneNumber })}</Heading>
          {hasDurationInfo && !isMobile && (
            <Badge variant="outline" size="sm">
              <Text fontSize="sm">{formattedDurationFrom}</Text>
              <UilArrowRight />
              <Text fontSize="sm">{formattedDurationTo}</Text>
            </Badge>
          )}
        </HStack>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Text fontSize="sm" color="gray.500">
          {t("Define the milestones for your project. Funds will be released as milestones are completed.")}
        </Text>
        <Accordion.ItemBody>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
            {/* Amount */}
            <GridItem colSpan={{ base: 1, md: 1 }}>
              <FormItem
                label={t("Amount")}
                placeholder="0 USD"
                register={register(`milestones.${index}.fundingAmount`, {
                  required: t("Please enter the amount for this milestone"),
                })}
                error={errors.milestones?.[index]?.fundingAmount?.message}
              />
            </GridItem>

            {/* Empty to fill the gap */}
            <GridItem colSpan={{ base: 1, md: 1 }}></GridItem>
            {/* Duration */}
            <GridItem colSpan={{ base: 1, md: 1 }}>
              <FormDateInput
                label="Duration"
                placeholder="Select start date"
                register={register(`milestones.${index}.durationFrom`, {
                  required: t("Please enter the duration for this milestone"),
                  validate: (value: number) => {
                    if (!value) return true
                    return value >= now || "Start date cannot be in the past"
                  },
                })}
                error={errors.milestones?.[index]?.durationFrom?.message}
                minDate={now} // now
                size="lg"
                watch={watch}
              />
            </GridItem>
            <GridItem colSpan={{ base: 1, md: 1 }}>
              <FormDateInput
                {...(isMobile && { label: "Duration" })}
                placeholder="Select end date"
                register={register(`milestones.${index}.durationTo`, {
                  required: t("Please enter the duration for this milestone"),
                  validate: (value: number) => {
                    if (!value) return true
                    const startDate = getValues(`milestones.${index}.durationFrom`)
                    if (startDate && value <= startDate) {
                      return "End date must be after start date"
                    }
                    return true
                  },
                })}
                error={errors.milestones?.[index]?.durationTo?.message}
                minDate={now} // now
                size="lg"
                watch={watch}
              />
            </GridItem>

            {/* Description */}
            <GridItem minH="160px" colSpan={{ base: 1, md: 1 }}>
              <FormItem
                label={t("Description")}
                type="textarea"
                placeholder={t("Milestone description")}
                register={register(`milestones.${index}.description`, {
                  required: t("Please enter the description for this milestone"),
                })}
                error={errors.milestones?.[index]?.description?.message}
              />
            </GridItem>
            {/* Tips */}
            <GridItem>
              <VStack bg="bg.tertiary" p={5} borderRadius="xl" mt={{ base: 0, md: 8 }} textAlign="start">
                <Heading size="sm" alignSelf="start">
                  {t("Tips")}
                </Heading>
                <Text fontSize="sm" color="text.subtle" alignSelf="start">
                  {t("Explain integration and launch on VeBetterDAO, like:")}
                </Text>
                <List.Root
                  listStyle="disc"
                  alignSelf="end"
                  fontSize="sm"
                  color="text.subtle"
                  textAlign="justify"
                  px={5}>
                  <List.Item>{t("B3TR integrated as a reward mechanism within the app")}</List.Item>
                  <List.Item>{t("VeWorld wallet support for seamless B3TR transactions")}</List.Item>
                  <List.Item>{t("Testing and optimization reporting to ensure smooth UX and functionality")}</List.Item>
                </List.Root>
              </VStack>
            </GridItem>
            {canRemoveAnyMilestone && (
              <GridItem colSpan={{ base: 1, md: 2 }} justifySelf="end">
                <Button variant="whiteAction" borderRadius="full" onClick={() => removeMilestone(index)}>
                  <Icon as={UilTrash} />
                  {t("Remove")}
                </Button>
              </GridItem>
            )}
          </Grid>
        </Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  )
}

export const Milestones = ({
  register,
  setValue,
  getValues,
  setData,
  errors,
  formData,
  watch,
  control,
}: MilestonesProps) => {
  const { t } = useTranslation()
  const milestones = getValues("milestones")
  const now = dayjs().unix()

  const handleAddMilestone = () => {
    //Get the last milestone
    const lastMilestone = milestones[milestones.length - 1] ?? { durationTo: now }
    //Append to internal array and update the form store
    milestones.push({
      description: "",
      fundingAmount: 0,
      durationFrom: dayjs(lastMilestone.durationTo * 1000)
        .add(1, "month")
        .unix(),
      durationTo: dayjs(lastMilestone.durationTo * 1000)
        .add(2, "month")
        .unix(),
    })
    setValue("milestones", milestones)
    //Persist the new milestone in the form data
    setData({ ...formData, milestones })
  }

  const handleRemoveMilestone = (index: number) => {
    if (index === 0) {
      return
    }
    //Remove the milestone from the form data
    const milestones = getValues("milestones")
    milestones.splice(index, 1)
    setValue("milestones", milestones)
    //Persist the new milestone in the form data
    setData({ ...formData, milestones })
  }

  return (
    <VStack align="stretch" w="full">
      <Accordion.Root multiple defaultValue={["milestone-0"]}>
        {milestones.map((milestone, index) => {
          const uniqueKey = `${milestone.durationFrom}-${milestone.durationTo}`
          return (
            <MilestoneSection
              key={uniqueKey}
              register={register}
              errors={errors}
              index={index}
              removeMilestone={handleRemoveMilestone}
              getValues={getValues}
              watch={watch}
            />
          )
        })}
      </Accordion.Root>
      <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(2, 1fr)" }} gap={6}>
        <GridItem>
          <Button variant="primaryLink" onClick={handleAddMilestone}>
            <Icon as={UilPlus} />
            {t("Add milestone")}
          </Button>
        </GridItem>
        <GridItem bg="#F8F8F8" p={4} borderRadius="xl" colSpan={2}>
          <Trans
            color="gray.100"
            textColor="gray.100"
            i18nKey="<b>Tip</b>: For a 12-months grant, it's best to break down milestones monthly or quarterly"
            components={{
              b: <Text as="span" fontWeight="bold" />,
            }}
          />
        </GridItem>
        <GridItem colSpan={2}>
          <FormCheckbox
            name="termsOfService"
            key="termsOfService"
            control={control}
            description={t("I agree to the Terms of Service and acknowledge the information provided is accurate.")}
            error={errors.termsOfService?.message}
            label={t("I agree to the Terms of Service and acknowledge the information provided is accurate.")}
          />
        </GridItem>
      </Grid>
    </VStack>
  )
}
