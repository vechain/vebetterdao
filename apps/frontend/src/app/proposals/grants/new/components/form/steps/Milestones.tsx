import { GenericAlert } from "@/app/components/Alert"
import { FormItem, FormMoneyInput } from "@/components/CustomFormFields"
import { FormCheckbox } from "@/components/CustomFormFields/FormCheckbox"
import { FormDateInput } from "@/components/CustomFormFields/FormDateInput"
import { validateMilestoneAmount } from "@/components/CustomFormFields/validators"
import { MAX_DAPP_GRANT_AMOUNT, MAX_TOOLING_GRANT_AMOUNT } from "@/constants"
import { GRANT_TERMS_AND_CONDITIONS_LINK } from "@/constants/links"
import { useMilestoneMinimumAmount } from "@/hooks/proposals/grants"
import { GrantFormData } from "@/hooks/proposals/grants/types"
import {
  Accordion,
  Badge,
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  Link,
  List,
  Text,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { UilPlus, UilTrash } from "@iconscout/react-unicons"
import { useGetTokenUsdPrice } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useMemo } from "react"
import { Control, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { LuArrowRight } from "react-icons/lu"

interface MilestonesProps {
  register: UseFormRegister<GrantFormData>
  setValue: UseFormSetValue<GrantFormData>
  getValues: UseFormGetValues<GrantFormData>
  setData: (data: Partial<GrantFormData>) => void
  watch: UseFormWatch<GrantFormData>
  errors: FieldErrors<GrantFormData>
  formData: GrantFormData
  control: Control<GrantFormData>
}

type MilestoneSectionProps = {
  register: UseFormRegister<GrantFormData>
  removeMilestone: (index: number) => void
  setData: (data: Partial<GrantFormData>) => void
  getValues: UseFormGetValues<GrantFormData>
  errors: FieldErrors<GrantFormData>
  watch: UseFormWatch<GrantFormData>
  index: number
  b3trPerUsd: number
  canRemoveAnyMilestone: boolean
  grantType: string
  setValue: UseFormSetValue<GrantFormData>
}

export const MilestoneSection = ({
  register,
  removeMilestone,
  getValues,
  watch,
  setValue,
  setData,
  index,
  errors,
  b3trPerUsd,
  canRemoveAnyMilestone,
  grantType,
}: MilestoneSectionProps) => {
  const { t } = useTranslation()

  const milestoneNumber = index + 1
  const isFirst = index === 0
  const [isMobile] = useMediaQuery(["(max-width: 767px)"])

  const now = dayjs().unix()
  const formatDuration = (duration: number | string) => {
    const durationInMiliseconds = Number(duration) * 1000 //Convert to miliseconds
    return dayjs(durationInMiliseconds).format("MM/DD/YYYY")
  }

  const currentMilestone = getValues(`milestones.${index}`)
  const hasDurationInfo = currentMilestone.durationFrom > 0 && currentMilestone.durationTo > 0
  const formattedDurationFrom = formatDuration(currentMilestone.durationFrom)
  const formattedDurationTo = formatDuration(currentMilestone.durationTo)

  // Sync individual milestone field to store
  const syncFieldToStore = (field: keyof typeof currentMilestone) => {
    const value = getValues(`milestones.${index}.${field}`)
    const updatedMilestones = [...getValues("milestones")]
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value,
    } as (typeof updatedMilestones)[0]
    setData({ milestones: updatedMilestones })
  }

  return (
    <Accordion.Item key={index} value={`milestone-${index}`} {...(isFirst && { borderTop: "none" })} pb={5}>
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
                max={grantType === "dapp" ? MAX_DAPP_GRANT_AMOUNT : MAX_TOOLING_GRANT_AMOUNT}
                initialValue={currentMilestone.fundingAmountUsd}
                registerPrimary={register(`milestones.${index}.fundingAmountUsd`, {
                  required: t("Please enter the amount for this milestone"),
                  validate: (value: number) => validateMilestoneAmount(value, grantType),
                })}
                registerSecondary={register(`milestones.${index}.fundingAmount`)}
                error={errors.milestones?.[index]?.fundingAmountUsd?.message}
                onUsdChange={(usdAmount, b3trAmount) => {
                  setValue(`milestones.${index}.fundingAmountUsd`, Number(usdAmount))
                  setValue(`milestones.${index}.fundingAmount`, Number(b3trAmount))

                  // Sync to store
                  const updatedMilestones = [...getValues("milestones")]
                  updatedMilestones[index] = {
                    ...updatedMilestones[index],
                    fundingAmountUsd: Number(usdAmount),
                    fundingAmount: Number(b3trAmount),
                  } as (typeof updatedMilestones)[0]
                  setData({ milestones: updatedMilestones })

                  setValue("milestones", updatedMilestones)
                }}
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
                onBlur={() => syncFieldToStore("durationFrom")}
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
                onBlur={() => syncFieldToStore("durationTo")}
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
                onBlur={() => syncFieldToStore("description")}
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

  const milestones = watch("milestones")
  const now = dayjs().unix()
  const grantType = getValues("grantType")
  const canRemoveAnyMilestone = useMemo(
    () => milestones.length > Number(milestoneMinimumAmount ?? 3),
    [milestones.length, milestoneMinimumAmount],
  )

  const handleAddMilestone = () => {
    //Get current milestones to avoid stale state
    const currentMilestones = getValues("milestones")
    const lastMilestone = currentMilestones[currentMilestones.length - 1] ?? { durationTo: now }

    //Create new milestone array
    const newMilestones = [
      ...currentMilestones,
      {
        description: "",
        fundingAmount: 0,
        fundingAmountUsd: 0,
        durationFrom: dayjs(lastMilestone.durationTo ?? now * 1000)
          .add(1, "month")
          .unix(),
        durationTo: dayjs(lastMilestone.durationTo ?? now * 1000)
          .add(2, "month")
          .unix(),
      },
    ]

    setValue("milestones", newMilestones)
    setData({ ...formData, milestones: newMilestones })
  }

  const handleRemoveMilestone = (index: number) => {
    if (index === 0) {
      return
    }
    //Get current milestones to avoid stale state
    const currentMilestones = getValues("milestones")
    const newMilestones = currentMilestones.filter((_, i) => i !== index)

    setValue("milestones", newMilestones)
    setData({ ...formData, milestones: newMilestones })
  }

  // Calculate total in real-time using watched values
  const totalRequestedAmount = useMemo(() => {
    if (!milestones || !Array.isArray(milestones)) return 0
    return milestones.reduce((acc, milestone) => {
      const amount = Number(milestone?.fundingAmountUsd) || 0
      return acc + amount
    }, 0)
  }, [milestones])

  const isTotalRequestedAmountValid = useMemo(() => {
    const maxAmount = grantType === "dapp" ? MAX_DAPP_GRANT_AMOUNT : MAX_TOOLING_GRANT_AMOUNT
    return totalRequestedAmount <= maxAmount
  }, [totalRequestedAmount, grantType])

  return (
    <VStack align="stretch" w="full">
      <Accordion.Root multiple defaultValue={["milestone-0"]}>
        {milestones.map((_, index) => {
          const uniqueKey = `milestone-${index}`
          return (
            <MilestoneSection
              key={uniqueKey}
              register={register}
              errors={errors}
              index={index}
              removeMilestone={handleRemoveMilestone}
              getValues={getValues}
              setData={setData}
              watch={watch}
              b3trPerUsd={B3TRPerUSD}
              canRemoveAnyMilestone={canRemoveAnyMilestone ?? false}
              grantType={grantType}
              setValue={setValue}
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
            label={
              <Trans
                color="text.default"
                i18nKey="I agree to the <Link>Terms of Service</Link> and acknowledge the information provided is accurate."
                components={{
                  Link: (
                    <Link
                      textDecoration="underline"
                      color="text.default"
                      target="_blank"
                      href={GRANT_TERMS_AND_CONDITIONS_LINK}
                    />
                  ),
                }}
              />
            }
            rules={{ required: "Please accept the terms of service" }}
            error={errors.termsOfService?.message}
          />
        </GridItem>
        {!isTotalRequestedAmountValid && (
          <GridItem colSpan={2}>
            <GenericAlert
              isLoading={false}
              type="error"
              message={t("The maximum amount for this grant type is {{value}} USD", {
                value: grantType === "dapp" ? MAX_DAPP_GRANT_AMOUNT : MAX_TOOLING_GRANT_AMOUNT,
              })}
            />
          </GridItem>
        )}
      </Grid>
    </VStack>
  )
}
