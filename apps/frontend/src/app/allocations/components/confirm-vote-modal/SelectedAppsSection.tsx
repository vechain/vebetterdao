"use client"

import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import type { AppWithVotes } from "../../lib/data"

import { AppAllocationCard } from "./AppAllocationCard"

interface SelectedAppsSectionProps {
  apps: AppWithVotes[]
  allocations: Map<string, number>
  onAllocationChange: (appId: string, percentage: number) => void
  vot3Balance: { original: string; scaled: string; formatted: string } | undefined
  isLoadingBalance: boolean
}

export const SelectedAppsSection = ({
  apps,
  allocations,
  onAllocationChange,
  vot3Balance,
  isLoadingBalance,
}: SelectedAppsSectionProps) => {
  const { t } = useTranslation()
  return (
    <Box>
      <HStack justifyContent="space-between" mb={2}>
        <Text textStyle="md" fontWeight="semibold">
          {t("Selected apps")}
        </Text>
        <Text color="text.subtle" textStyle="sm" fontWeight="normal">
          {apps.length} {apps.length === 1 ? t("app") : t("apps")}
        </Text>
      </HStack>

      <VStack gap={3} alignItems="stretch">
        {apps.map(app => (
          <AppAllocationCard
            key={app.id}
            app={app}
            percentage={allocations.get(app.id) ?? 0}
            onPercentageChange={percentage => onAllocationChange(app.id, percentage)}
            vot3Balance={vot3Balance}
            isLoadingBalance={isLoadingBalance}
          />
        ))}
      </VStack>
    </Box>
  )
}
