import React, { useMemo, useState } from "react"
import { Box, HStack, VStack, Grid, Spinner } from "@chakra-ui/react"
import { FilterAppsTypeButton } from "./FilterAppsTypeButton"
import { XApp, UnendorsedApp } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"

const FILTER_ALL = "All"
const FILTER_ACTIVE_APPS = "Active apps"
const FILTER_GRACE_PERIOD = "In grace period"
const FILTER_ENDORSEMENT_LOST = "Endorsement lost"

type Props = {
  activeApps: XApp[]
  gracePeriodApps: UnendorsedApp[]
  lostEndorsementApps: UnendorsedApp[]
  isXAppsLoading: boolean
}

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
        return [...activeApps, ...lostEndorsementApps]
    }
  }, [filter, activeApps, gracePeriodApps, lostEndorsementApps])

  const appsSection = useMemo(() => {
    return isXAppsLoading ? (
      <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size="lg" />
      </VStack>
    ) : (
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} w="full">
        {displayApps.map(xApp => (
          <UnendorsedAppCard key={xApp.id} xApp={xApp} />
        ))}
      </Grid>
    )
  }, [displayApps, isXAppsLoading])

  return (
    <VStack spacing={8} w="full" data-testid="apps-page">
      <Box
        w="full"
        overflowX="auto"
        whiteSpace="nowrap"
        css={{
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
        <HStack spacing={4} minWidth="max-content" justifyContent="flex-start" flexWrap="nowrap">
          {[FILTER_ALL, FILTER_ACTIVE_APPS, FILTER_GRACE_PERIOD, FILTER_ENDORSEMENT_LOST].map(filterType => (
            <FilterAppsTypeButton
              key={filterType}
              filterType={filterType}
              currentFilter={filter}
              setFilter={setFilter}
            />
          ))}
        </HStack>
      </Box>
      {appsSection}
    </VStack>
  )
}
