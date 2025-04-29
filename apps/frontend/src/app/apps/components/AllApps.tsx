import React, { useMemo, useState } from "react"
import { Box, HStack, VStack, Grid, Spinner, GridItem, InputLeftElement, InputGroup, Input } from "@chakra-ui/react"
import { FilterAppsTypeButton } from "./FilterAppsTypeButton"
import { XApp, UnendorsedApp, useXNode } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"
import { AppsEmptyState } from "./AppsEmptyState"
import { CreatorBanner } from "./CreatorBanner"
import { FaSearch } from "react-icons/fa"

const FILTER_ALL = "All"
const FILTER_ACTIVE_APPS = "Active apps"
const FILTER_GRACE_PERIOD = "In grace period"
const FILTER_ENDORSEMENT_LOST = "Endorsement lost"

type Props = {
  allApps: XApp[]
  currentActiveApps: XApp[]
  gracePeriodApps: UnendorsedApp[]
  endorsementLostApps: UnendorsedApp[]
  isXAppsLoading: boolean
}

type LayoutKey = "endorser" | "default"

export const AllApps = ({
  allApps,
  currentActiveApps,
  gracePeriodApps,
  endorsementLostApps,
  isXAppsLoading,
}: Props) => {
  const [filter, setFilter] = useState(FILTER_ALL)
  const [searchQuery, setSearchQuery] = useState("")

  const showCreatorBanner = useMemo(() => filter === FILTER_ALL, [filter])
  const displayApps = useMemo(() => {
    let filteredApps: (XApp | UnendorsedApp)[] = []

    // Filter xApps based on selected filter value
    switch (filter) {
      case FILTER_ACTIVE_APPS:
        filteredApps = currentActiveApps
        break
      case FILTER_GRACE_PERIOD:
        filteredApps = gracePeriodApps
        break
      case FILTER_ENDORSEMENT_LOST:
        filteredApps = endorsementLostApps
        break
      default:
        filteredApps = allApps
    }

    // Filter by search query if it exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return filteredApps.filter(app => app.name.toLowerCase().includes(query))
    }

    return filteredApps
  }, [filter, searchQuery, currentActiveApps, gracePeriodApps, endorsementLostApps, allApps])

  const { isEndorsingApp } = useXNode()
  const layout: LayoutKey = isEndorsingApp ? "endorser" : "default"

  const appsSection = useMemo(() => {
    const isEmpty = !displayApps?.length
    return isXAppsLoading ? (
      <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size="lg" />
      </VStack>
    ) : (
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} w="full">
        {isEmpty ? (
          <GridItem colSpan={2}>
            <AppsEmptyState />
          </GridItem>
        ) : (
          <>
            {showCreatorBanner ? <CreatorBanner /> : undefined}
            {displayApps.map((xApp, _) => (
              <UnendorsedAppCard key={xApp.id} xApp={xApp} layout={layout} />
            ))}
          </>
        )}
      </Grid>
    )
  }, [displayApps, isXAppsLoading, showCreatorBanner, layout])

  return (
    <>
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
          <HStack w="full" mt={4}>
            <InputGroup w="full">
              <InputLeftElement pointerEvents="none">
                <FaSearch color="#3B3B3B" />
              </InputLeftElement>
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                borderRadius="full"
                bg="white"
                _dark={{ bg: "#6a6a6a" }}
                _hover={{ borderColor: "#004CFC" }}
                _focus={{ borderColor: "#004CFC", boxShadow: "0px 0px 16px 0px rgba(0, 76, 252, 0.35)" }}
              />
            </InputGroup>
          </HStack>
        </Box>
        {appsSection}
      </VStack>
    </>
  )
}
