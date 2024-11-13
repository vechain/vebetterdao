import React, { useMemo, useState } from "react"
import { HStack, VStack, Grid, Spinner } from "@chakra-ui/react"
import { FilterAppsTypeButton } from "./FilterAppsTypeButton"
import { XApp, UnendorsedApp } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"

type Props = {
  activeApps: XApp[]
  gracePeriodApps: UnendorsedApp[]
  lostEndorsementApps: UnendorsedApp[]
  isXAppsLoading: boolean
}

const FILTER_ALL = "All"
const FILTER_ACTIVE_APPS = "Active apps"
const FILTER_GRACE_PERIOD = "In grace period"
const FILTER_ENDORSEMENT_LOST = "Endorsement lost"

export const AllApps = ({ activeApps, gracePeriodApps, lostEndorsementApps, isXAppsLoading }: Props) => {
  const [filter, setFilter] = useState(FILTER_ALL)

  // Filter xApps based on selected filter value
  const displayApps = useMemo(() => {
    switch (filter) {
      case FILTER_ACTIVE_APPS:
        return activeApps
      case FILTER_GRACE_PERIOD:
        return gracePeriodApps
      case FILTER_ENDORSEMENT_LOST:
        return lostEndorsementApps
      default:
        return [...activeApps, ...gracePeriodApps, ...lostEndorsementApps]
    }
  }, [filter, activeApps, gracePeriodApps, lostEndorsementApps])

  const appsSection = useMemo(() => {
    return isXAppsLoading ? (
      <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size="lg" />
      </VStack>
    ) : (
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
        {displayApps.map(xApp => (
          <UnendorsedAppCard key={xApp.id} xApp={xApp} />
        ))}
      </Grid>
    )
  }, [displayApps, isXAppsLoading])

  return (
    <VStack spacing={8} w="full" data-testid="apps-page">
      <HStack
        w="full"
        overflowX="auto"
        overflowY="visible"
        spacing={4}
        justifyContent="space-between"
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
        {[FILTER_ALL, FILTER_ACTIVE_APPS, FILTER_GRACE_PERIOD, FILTER_ENDORSEMENT_LOST].map(filterType => (
          <FilterAppsTypeButton key={filterType} filterType={filterType} currentFilter={filter} setFilter={setFilter} />
        ))}
      </HStack>
      {appsSection}
    </VStack>
  )
}
