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
import { FormItem, FormMoneyInput } from "@/components/CustomFormFields"
import { FormDateInput } from "@/components/CustomFormFields/FormDateInput"
import { type GrantFormData } from "@/hooks/proposals/grants/types"
import { UilPlus, UilTrash } from "@iconscout/react-unicons"
import { LuArrowRight } from "react-icons/lu"
import { FormCheckbox } from "@/components/CustomFormFields/FormCheckbox"
import dayjs from "dayjs"
import { useMilestoneMinimumAmount } from "@/hooks/proposals/grants"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import { TFunction } from "i18next"

//TODO: Move to constants file
const MAX_DAPP_GRANT_AMOUNT = 30000
const MAX_TOOLING_GRANT_AMOUNT = 50000

//TODO: Move to utils file for validation
const validateMilestoneAmount = (value: number, grantType: string, t: TFunction) => {
  if (!value) return true

  if (grantType === "dapp") {
    return value > MAX_DAPP_GRANT_AMOUNT
      ? t("Dapp grant amount must be less than or equal to {{value}} USD", {
          value: MAX_DAPP_GRANT_AMOUNT,
        })
      : true
  } else if (grantType === "tooling") {
    return value > MAX_TOOLING_GRANT_AMOUNT
      ? t("Tooling grant amount must be less than or equal to {{value}} USD", {
          value: MAX_TOOLING_GRANT_AMOUNT,
        })
      : true
  }

  return true
}

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
  b3trPerUsd: number
  milestoneMinimumAmount: bigint
  grantType: string
}

export const MilestoneSection = ({
  register,
  errors,
  index,
  removeMilestone,
  getValues,
  watch,
  b3trPerUsd,
  milestoneMinimumAmount,
  grantType,
}: MilestoneSectionProps) => {
  const { t } = useTranslation()

  const milestoneNumber = index + 1
  const isFirst = index === 0
  const [isMobile] = useMediaQuery(["(max-width: 767px)"])

  const now = dayjs().unix()
  const canRemoveAnyMilestone = milestoneNumber > Number(milestoneMinimumAmount)
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
            <Badge variant="outline" fontSize="sm" fontWeight="regular">
              <Text>{formattedDurationFrom}</Text>
              <LuArrowRight color="subtle.active" size={16} />
              <Text>{formattedDurationTo}</Text>
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
            <GridItem colSpan={1}>
              <FormMoneyInput
                label={t("Amount")}
                placeholder="10,000"
                conversionRate={b3trPerUsd}
                register={register(`milestones.${index}.fundingAmount`, {
                  required: t("Please enter the amount for this milestone"),
                  validate: (value: number) => validateMilestoneAmount(value, grantType, t),
                })}
                error={errors.milestones?.[index]?.fundingAmount?.message}
              />
            </GridItem>

            {/* Empty to fill the gap */}
            <GridItem colSpan={1}></GridItem>
            {/* Duration */}
            <GridItem colSpan={1}>
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
            <GridItem colSpan={1}>
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
            <GridItem minH="160px" colSpan={1}>
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
  const { data: milestoneMinimumAmount } = useMilestoneMinimumAmount()
  const { data: conversionRate } = useGetTokenUsdPrice("B3TR")

  const B3TRPerUSD = 1 / (Number(conversionRate) ?? 1)

  const milestones = getValues("milestones")
  const now = dayjs().unix()
  const grantType = getValues("grantType")

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
              b3trPerUsd={B3TRPerUSD}
              milestoneMinimumAmount={milestoneMinimumAmount ?? BigInt(0)}
              grantType={grantType}
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
        <GridItem bg="bg.tertiary" p={4} borderRadius="xl" colSpan={2}>
          <Text color="text.subtle">
            <Trans
              i18nKey="<b>Tip</b>: For a 12-months grant, it's best to break down milestones monthly or quarterly"
              components={{
                b: <b />,
              }}
            />
          </Text>
        </GridItem>
        <GridItem colSpan={2}>
          <FormCheckbox<GrantFormData>
            name="termsOfService"
            key="termsOfService"
            control={control}
            label={t("I agree to the Terms of Service and acknowledge the information provided is accurate.")}
            rules={{ required: "Please accept the terms of service" }}
            error={errors.termsOfService?.message}
          />
        </GridItem>
      </Grid>
    </VStack>
  )
}
