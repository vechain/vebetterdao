"use client"

import { Badge, HStack, Text, VStack } from "@chakra-ui/react"
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
    <VStack gap={2} align="stretch">
      <HStack justify="space-between">
        <Text textStyle="sm" fontWeight="semibold">
          {t("Selected apps")}
        </Text>
        <Badge variant="neutral" size="sm" rounded="sm">
          {apps.length} {apps.length === 1 ? t("app") : t("apps")}
        </Badge>
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
    </VStack>
  )
}
