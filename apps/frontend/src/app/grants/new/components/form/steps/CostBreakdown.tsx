import { Button, Grid, GridItem, Icon, Text, VStack } from "@chakra-ui/react"
import { UilPlus, UilTrash } from "@iconscout/react-unicons"
import { useMemo } from "react"
import { Control, FieldErrors, UseFormGetValues, UseFormRegister, UseFormSetValue, useWatch } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { FormItem } from "@/components/CustomFormFields/FormItem"
import { GrantFormData } from "@/hooks/proposals/grants/types"

const MAX_SPENDING_PLAN_LENGTH = 1500

interface CostBreakdownProps {
  register: UseFormRegister<GrantFormData>
  setValue: UseFormSetValue<GrantFormData>
  getValues: UseFormGetValues<GrantFormData>
  setData: (data: Partial<GrantFormData>) => void
  errors: FieldErrors<GrantFormData>
  control: Control<GrantFormData>
}

export const CostBreakdown = ({ register, setValue, getValues, setData, errors, control }: CostBreakdownProps) => {
  const { t } = useTranslation()
  // useWatch (vs watch) re-renders on every nested-field change in the array,
  // so totalBudget updates live as amounts are typed — not only on add/remove.
  const watchedCostBreakdown = useWatch({ control, name: "costBreakdown" })
  const costBreakdown = useMemo(() => watchedCostBreakdown ?? [], [watchedCostBreakdown])

  const totalBudget = useMemo(() => {
    return costBreakdown.reduce((acc, item) => acc + (Number(item?.amount) || 0), 0)
  }, [costBreakdown])

  const syncToStore = () => {
    const current = getValues("costBreakdown")
    setData({ costBreakdown: current })
  }

  const handleAddItem = () => {
    const updated = [...costBreakdown, { category: "", description: "", amount: 0 }]
    setValue("costBreakdown", updated)
    setData({ costBreakdown: updated })
  }

  const handleRemoveItem = (index: number) => {
    const updated = costBreakdown.filter((_, i) => i !== index)
    setValue("costBreakdown", updated)
    setData({ costBreakdown: updated })
  }

  return (
    <VStack align="stretch" w="full" gap={6}>
      <VStack align="flex-start" gap={1}>
        <Text textStyle="lg" fontWeight="semibold">
          {t("Cost breakdown")}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {t(
            "Provide a detailed, line-item breakdown justifying how the total grant amount was calculated. Include estimates, justifications, and any relevant assumptions.",
          )}
        </Text>
      </VStack>

      {costBreakdown.map((_, index) => (
        <VStack
          key={index}
          align="stretch"
          gap={4}
          p={4}
          borderWidth="1px"
          borderRadius="xl"
          borderColor="border.primary">
          <Text textStyle="sm" fontWeight="semibold">
            {t("Item {{number}}", { number: index + 1 })}
          </Text>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={4}>
            <GridItem>
              <FormItem
                label={t("Category")}
                placeholder={t("e.g. Development, Marketing, Audit")}
                register={register(`costBreakdown.${index}.category`, {
                  required: t("Please enter a budget category"),
                })}
                error={errors.costBreakdown?.[index]?.category?.message}
                onBlur={syncToStore}
              />
            </GridItem>
            <GridItem>
              <FormItem
                label={t("Amount (USD)")}
                placeholder="e.g. 5000"
                type="number"
                register={register(`costBreakdown.${index}.amount`, {
                  required: t("Please enter an amount"),
                  valueAsNumber: true,
                  min: { value: 1, message: t("Amount must be greater than 0") },
                })}
                error={errors.costBreakdown?.[index]?.amount?.message}
                onBlur={syncToStore}
              />
            </GridItem>
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <FormItem
                label={t("Justification")}
                type="textarea"
                placeholder={t("Explain what this budget item covers and why it's needed")}
                register={register(`costBreakdown.${index}.description`, {
                  required: t("Please provide a justification"),
                })}
                error={errors.costBreakdown?.[index]?.description?.message}
                onBlur={syncToStore}
              />
            </GridItem>
          </Grid>
          {costBreakdown.length > 1 && (
            <Button
              variant="secondary"
              borderRadius="full"
              alignSelf="flex-end"
              onClick={() => handleRemoveItem(index)}>
              <Icon as={UilTrash} />
              {t("Remove")}
            </Button>
          )}
        </VStack>
      ))}

      <Button variant="link" onClick={handleAddItem} alignSelf="flex-start">
        <Icon as={UilPlus} />
        {t("Add budget item")}
      </Button>

      <VStack bg="bg.tertiary" p={4} borderRadius="xl" align="flex-start">
        <Text textStyle="sm" fontWeight="semibold">
          {t("Total budget")}
          {": $"}
          {totalBudget.toLocaleString()} {"USD"}
        </Text>
      </VStack>

      <VStack align="flex-start" gap={1} pt={4}>
        <Text textStyle="lg" fontWeight="semibold">
          {t("Spending plan")}
        </Text>
        <Text textStyle="sm" color="text.subtle">
          {t(
            "Outline how the grant funds will be allocated across budget categories and provide an estimated timeline for delivery.",
          )}
        </Text>
      </VStack>

      <FormItem
        label={t("Spending plan")}
        type="textarea"
        placeholder={t(
          "Describe how funds will be allocated over time, e.g.:\n- Q1: Development & smart contract work ($X)\n- Q2: Marketing & community building ($X)\n- Q3: Security audit & launch ($X)",
        )}
        register={register("spendingPlan", {
          required: t("Please provide a spending plan"),
          maxLength: {
            value: MAX_SPENDING_PLAN_LENGTH,
            message: t("Text too long. Maximum allowed: {{amount}} characters.", {
              amount: MAX_SPENDING_PLAN_LENGTH,
            }),
          },
        })}
        maxLength={MAX_SPENDING_PLAN_LENGTH}
        error={errors.spendingPlan?.message}
        onBlur={() => {
          const val = getValues("spendingPlan")
          setData({ spendingPlan: val })
        }}
      />
    </VStack>
  )
}
