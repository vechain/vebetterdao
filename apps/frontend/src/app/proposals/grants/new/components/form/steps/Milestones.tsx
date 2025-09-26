import { GenericAlert } from "@/app/components/Alert"
import { FormItem, FormMoneyInput } from "@/components/CustomFormFields"
import { FormCheckbox } from "@/components/CustomFormFields/FormCheckbox"
import { FormDateInput } from "@/components/CustomFormFields/FormDateInput"
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

// ============================================================================
// Constants & Utilities
// ============================================================================

const formatDuration = (duration: number | string): string => {
  const durationInMilliseconds = Number(duration) * 1000 // Convert to milliseconds
  return dayjs(durationInMilliseconds).format("MM/DD/YYYY")
}

const getDefaultMilestone = () => ({
  description: "",
  fundingAmount: 0,
  fundingAmountUsd: 0,
  durationFrom: 0,
  durationTo: 0,
})

const calculateTotalAmount = (milestones: GrantFormData["milestones"]): number => {
  if (!milestones || !Array.isArray(milestones)) return 0
  return milestones.reduce((acc, milestone) => {
    const amount = Number(milestone?.fundingAmountUsd) || 0
    return acc + amount
  }, 0)
}

const getMaxGrantAmount = (grantType: string): number => {
  return grantType === "dapp" ? MAX_DAPP_GRANT_AMOUNT : MAX_TOOLING_GRANT_AMOUNT
}

// ============================================================================
// Types & Interfaces
// ============================================================================

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

interface MilestoneSectionProps {
  register: UseFormRegister<GrantFormData>
  setValue: UseFormSetValue<GrantFormData>
  getValues: UseFormGetValues<GrantFormData>
  setData: (data: Partial<GrantFormData>) => void
  watch: UseFormWatch<GrantFormData>
  errors: FieldErrors<GrantFormData>
  index: number
  b3trPerUsd: number
  canRemoveAnyMilestone: boolean
  grantType: string
  removeMilestone: (index: number) => void
}

interface ValidationOptions {
  grantType: string
  milestones: GrantFormData["milestones"]
  currentIndex: number
  currentValue: number
}

// ============================================================================
// Validation Functions
// ============================================================================

const validateMilestoneAmount = ({
  grantType,
  milestones,
  currentIndex,
  currentValue,
}: ValidationOptions): string | boolean => {
  const total = milestones.reduce((acc, milestone, idx) => {
    // Use the current value being validated if it's for this milestone
    const amount = idx === currentIndex ? currentValue : milestone.fundingAmountUsd
    return acc + (Number(amount) || 0)
  }, 0)

  const maxAmount = getMaxGrantAmount(grantType)
  return (
    total <= maxAmount ||
    `Total amount across all milestones exceeds maximum allowed: $${maxAmount.toLocaleString()} USD`
  )
}

const validateStartDate = (value: number, now: number): string | boolean => {
  if (!value || value === 0) return "Please enter the duration for this milestone"
  return value >= now || "Start date cannot be in the past"
}

const validateEndDate = (value: number, startDate: number): string | boolean => {
  if (!value || value === 0) return "Please enter the duration for this milestone"
  if (startDate && value <= startDate) {
    return "End date must be after start date"
  }
  return true
}

// ============================================================================
// Sub-components
// ============================================================================

const MilestoneTips = () => {
  const { t } = useTranslation()

  return (
    <VStack bg="bg.tertiary" p={5} borderRadius="xl" mt={{ base: 0, md: 8 }} textAlign="start">
      <Heading size="sm" alignSelf="start">
        {t("Tips")}
      </Heading>
      <Text fontSize="sm" color="text.subtle" alignSelf="start">
        {t("Explain integration and launch on VeBetterDAO, like:")}
      </Text>
      <List.Root listStyle="disc" alignSelf="end" fontSize="sm" color="text.subtle" textAlign="justify" px={5}>
        <List.Item>{t("B3TR integrated as a reward mechanism within the app")}</List.Item>
        <List.Item>{t("VeWorld wallet support for seamless B3TR transactions")}</List.Item>
        <List.Item>{t("Testing and optimization reporting to ensure smooth UX and functionality")}</List.Item>
      </List.Root>
    </VStack>
  )
}

const MilestoneHeader = ({
  milestoneNumber,
  hasDurationInfo,
  formattedDurationFrom,
  formattedDurationTo,
  isMobile,
}: {
  milestoneNumber: number
  hasDurationInfo: boolean
  formattedDurationFrom: string
  formattedDurationTo: string
  isMobile: boolean
}) => {
  const { t } = useTranslation()

  return (
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
  )
}

const TermsOfServiceCheckbox = ({
  control,
  errors,
}: {
  control: Control<GrantFormData>
  errors: FieldErrors<GrantFormData>
}) => {
  return (
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
  )
}

// ============================================================================
// Main Components
// ============================================================================

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

  // Component state and computed values
  const milestoneNumber = index + 1
  const isFirst = index === 0
  const mediaQueryResult = useMediaQuery(["(max-width: 767px)"])
  const isMobile = mediaQueryResult?.[0] ?? false
  const now = dayjs().unix()

  const currentMilestone = getValues(`milestones.${index}`)
  const hasDurationInfo = currentMilestone.durationFrom > 0 && currentMilestone.durationTo > 0
  const formattedDurationFrom = formatDuration(currentMilestone.durationFrom)
  const formattedDurationTo = formatDuration(currentMilestone.durationTo)
  const maxAmount = getMaxGrantAmount(grantType)

  // Event handlers
  const syncFieldToStore = (field: keyof typeof currentMilestone) => {
    const value = getValues(`milestones.${index}.${field}`)
    const updatedMilestones = [...getValues("milestones")]
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value,
    } as (typeof updatedMilestones)[0]
    setData({ milestones: updatedMilestones })
  }

  const handleAmountChange = (usdAmount: string, b3trAmount: string) => {
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

    // Trigger validation for all milestone amounts to update total validation
    setTimeout(() => {
      getValues("milestones").forEach((_, idx) => {
        if (idx !== index) {
          setValue(`milestones.${idx}.fundingAmountUsd`, getValues(`milestones.${idx}.fundingAmountUsd`), {
            shouldValidate: true,
          })
        }
      })
    }, 0)
  }

  return (
    <Accordion.Item key={index} value={`milestone-${index}`} {...(isFirst && { borderTop: "none" })}>
      <Accordion.ItemTrigger w="full" py={4} textAlign="left" justifyContent="space-between">
        <MilestoneHeader
          milestoneNumber={milestoneNumber}
          hasDurationInfo={hasDurationInfo}
          formattedDurationFrom={formattedDurationFrom}
          formattedDurationTo={formattedDurationTo}
          isMobile={Boolean(isMobile)}
        />
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Text fontSize="sm" color="gray.500">
          {t("Define the milestones for your project. Funds will be released as milestones are completed.")}
        </Text>
        <Accordion.ItemBody>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} pl="1">
            {/* Amount */}
            <GridItem colSpan={1}>
              <FormMoneyInput
                label={t("Amount")}
                placeholder="10,000"
                conversionRate={b3trPerUsd}
                max={maxAmount}
                initialValue={currentMilestone.fundingAmountUsd}
                registerPrimary={register(`milestones.${index}.fundingAmountUsd`, {
                  required: t("Please enter the amount for this milestone"),
                  validate: (value: number) =>
                    validateMilestoneAmount({
                      grantType,
                      milestones: getValues("milestones"),
                      currentIndex: index,
                      currentValue: value,
                    }),
                })}
                registerSecondary={register(`milestones.${index}.fundingAmount`)}
                error={errors.milestones?.[index]?.fundingAmountUsd?.message}
                onUsdChange={handleAmountChange}
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
                  validate: (value: number) => validateStartDate(value, now),
                })}
                error={errors.milestones?.[index]?.durationFrom?.message}
                minDate={now} // now
                size="xl"
                watch={watch}
                onBlur={() => syncFieldToStore("durationFrom")}
              />
            </GridItem>
            <GridItem colSpan={1}>
              <FormDateInput
                {...(isMobile && { label: "Duration" })}
                placeholder="Select end date"
                register={register(`milestones.${index}.durationTo`, {
                  validate: (value: number) => validateEndDate(value, getValues(`milestones.${index}.durationFrom`)),
                })}
                error={errors.milestones?.[index]?.durationTo?.message}
                minDate={now} // now
                size="lg"
                watch={watch}
                onBlur={() => syncFieldToStore("durationTo")}
              />
            </GridItem>

            {/* Description */}
            <GridItem minH="160px" h="full" colSpan={1}>
              <FormItem
                label={t("Description")}
                type="textarea"
                placeholder={t("Milestone description")}
                register={register(`milestones.${index}.description`, {
                  required: t("Please enter the description for this milestone"),
                  maxLength: {
                    value: 800,
                    message: t("{{fieldName}} is too long", { fieldName: t("Description") }),
                  },
                })}
                maxLength={800}
                error={errors.milestones?.[index]?.description?.message}
                onBlur={() => syncFieldToStore("description")}
              />
            </GridItem>
            {/* Tips */}
            <GridItem>
              <MilestoneTips />
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

  // Hooks and data
  const { data: milestoneMinimumAmount } = useMilestoneMinimumAmount()
  const { data: conversionRate } = useGetTokenUsdPrice("B3TR")

  // Computed values
  const B3TRPerUSD = 1 / (Number(conversionRate) ?? 1)
  const milestones = watch("milestones")
  const grantType = getValues("grantType")

  const canRemoveAnyMilestone = useMemo(
    () => milestones.length > Number(milestoneMinimumAmount ?? 3),
    [milestones.length, milestoneMinimumAmount],
  )

  const totalRequestedAmount = useMemo(() => calculateTotalAmount(milestones), [milestones])

  const isTotalRequestedAmountValid = useMemo(() => {
    return totalRequestedAmount <= getMaxGrantAmount(grantType)
  }, [totalRequestedAmount, grantType])

  // Event handlers
  const handleAddMilestone = () => {
    const currentMilestones = getValues("milestones")
    const newMilestone = getDefaultMilestone()
    const newMilestones = [...currentMilestones, newMilestone]

    setValue("milestones", newMilestones)
    setData({ ...formData, milestones: newMilestones })
  }

  const handleRemoveMilestone = (index: number) => {
    if (index === 0) return

    const currentMilestones = getValues("milestones")
    const newMilestones = currentMilestones.filter((_, i) => i !== index)

    setValue("milestones", newMilestones)
    setData({ ...formData, milestones: newMilestones })
  }

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
              canRemoveAnyMilestone={canRemoveAnyMilestone}
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
          <TermsOfServiceCheckbox control={control} errors={errors} />
        </GridItem>

        {!isTotalRequestedAmountValid && (
          <GridItem colSpan={2}>
            <GenericAlert
              isLoading={false}
              type="error"
              message={t("The maximum amount for this grant type is {{value}} USD", {
                value: getMaxGrantAmount(grantType),
              })}
            />
          </GridItem>
        )}
      </Grid>
    </VStack>
  )
}

// ============================================================================
// Summary
// ============================================================================

// This file contains the organized Milestones component with:
// 1. Constants and utility functions at the top
// 2. Clear type definitions and interfaces
// 3. Validation functions for reusability
// 4. Sub-components for modularity
// 5. Main components with clear structure and separation of concerns
