import { Grid, GridItem, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { BudgetLineItem, GrantProposalEnriched } from "@/hooks/proposals/grants/types"

interface CostBreakdownViewProps {
  proposal: GrantProposalEnriched
}

export const CostBreakdownView = ({ proposal }: CostBreakdownViewProps) => {
  const { t } = useTranslation()
  const costBreakdown = useMemo(() => proposal.costBreakdown ?? [], [proposal.costBreakdown])
  const spendingPlan = proposal.spendingPlan ?? ""

  const totalBudget = useMemo(() => {
    return costBreakdown.reduce((acc: number, item: BudgetLineItem) => acc + (Number(item.amount) || 0), 0)
  }, [costBreakdown])

  // Don't render anything for grants that predate this feature
  if (costBreakdown.length === 0 && !spendingPlan) {
    return (
      <VStack align="flex-start" gap={2} py={4}>
        <Text textStyle="sm" color="text.subtle">
          {t("No budget information available for this grant.")}
        </Text>
      </VStack>
    )
  }

  return (
    <VStack align="stretch" gap={6} w="full">
      {/* Cost Breakdown Table */}
      {costBreakdown.length > 0 && (
        <VStack align="flex-start" gap={3}>
          <Text textStyle="md" fontWeight="semibold">
            {t("Cost breakdown")}
          </Text>
          <Grid templateColumns="2fr 2fr 1fr" gap={2} w="full" px={2}>
            <GridItem>
              <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
                {t("Category")}
              </Text>
            </GridItem>
            <GridItem>
              <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
                {t("Justification")}
              </Text>
            </GridItem>
            <GridItem textAlign="right">
              <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
                {t("Amount (USD)")}
              </Text>
            </GridItem>
            {costBreakdown.map((item: BudgetLineItem, index: number) => (
              // eslint-disable-next-line react/no-array-index-key
              <Grid key={`row-${index}`} templateColumns="2fr 2fr 1fr" gap={2} w="full" px={2}>
                <GridItem>
                  <Text textStyle="sm">{item.category}</Text>
                </GridItem>
                <GridItem>
                  <Text textStyle="sm" color="text.subtle">
                    {item.description}
                  </Text>
                </GridItem>
                <GridItem textAlign="right">
                  <Text textStyle="sm">
                    {"$"}
                    {Number(item.amount).toLocaleString()}
                  </Text>
                </GridItem>
              </Grid>
            ))}
          </Grid>
          <VStack align="flex-end" w="full" px={2} pt={2} borderTopWidth="1px" borderColor="border.primary">
            <Text textStyle="sm" fontWeight="semibold">
              {t("Total")}
              {": $"}
              {totalBudget.toLocaleString()} {"USD"}
            </Text>
          </VStack>
        </VStack>
      )}

      {/* Spending Plan */}
      {spendingPlan && (
        <VStack align="flex-start" gap={2}>
          <Text textStyle="md" fontWeight="semibold">
            {t("Spending plan")}
          </Text>
          <Text textStyle="sm" color="text.subtle" whiteSpace="pre-wrap">
            {spendingPlan}
          </Text>
        </VStack>
      )}
    </VStack>
  )
}
