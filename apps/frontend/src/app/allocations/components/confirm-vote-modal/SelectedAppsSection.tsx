"use client"

import { Box, Text, VStack } from "@chakra-ui/react"

import type { AppWithVotes } from "../../page"

import { AppAllocationCard } from "./AppAllocationCard"

interface SelectedAppsSectionProps {
  apps: AppWithVotes[]
  allocations: Map<string, number>
  onAllocationChange: (appId: string, percentage: number) => void
}

export const SelectedAppsSection = ({ apps, allocations, onAllocationChange }: SelectedAppsSectionProps) => {
  return (
    <Box>
      <Text textStyle="md" fontWeight="semibold" mb={2} display="flex" justifyContent="space-between">
        <span>{"Selected apps"}</span>
        <Text as="span" color="text.subtle" textStyle="sm" fontWeight="normal">
          {apps.length} {apps.length === 1 ? "app" : "apps"}
        </Text>
      </Text>

      <VStack gap={3} alignItems="stretch">
        {apps.map(app => (
          <AppAllocationCard
            key={app.id}
            app={app}
            percentage={allocations.get(app.id) ?? 0}
            onPercentageChange={percentage => onAllocationChange(app.id, percentage)}
          />
        ))}
      </VStack>
    </Box>
  )
}
