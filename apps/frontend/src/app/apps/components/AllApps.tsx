import React, { useMemo, useState } from "react"
import { HStack, VStack, Grid, Spinner } from "@chakra-ui/react"

import { FilterAppsTypeButton } from "./FilterAppsTypeButton"

import { XApp, UnendorsedApp } from "@/api"
import { UnendorsedAppCard } from "./UnendorsedAppCard"

type Props = {
  allApps: (XApp | UnendorsedApp)[]
  isXAppsLoading: boolean
}

// type SortOption = "score" | "name" | "recent"

export const AllApps = ({ allApps, isXAppsLoading }: Props) => {
  const [filter, setFilter] = useState("All")
  console.log("allApps", allApps)
  console.log("filter", filter)

  // Filter xApps based on selected filter value
  const displayApps = useMemo(() => {
    switch (filter) {
      case "Active apps":
        return allApps.filter(xApp => !("appAvailableForAllocationVoting" in xApp))
      case "In grace period":
        return allApps.filter(xApp => (xApp as UnendorsedApp).appAvailableForAllocationVoting === true)
      case "Endorsement lost":
        return allApps.filter(xApp => (xApp as UnendorsedApp).appAvailableForAllocationVoting === false)
      default:
        return allApps // "All" - no filtering
    }
  }, [filter, allApps])

  // const handleSortChange = useCallback((newSortOption: SortOption) => {
  //   setSortOption(newSortOption)
  // }, [])

  // const sortedApps = useMemo(() => {
  //   return [...filteredApps].sort((a, b) => {
  //     switch (sortOption) {
  //       case "score":
  //         return b.endorsementScore - a.endorsementScore
  //       case "name":
  //         return a.name.localeCompare(b.name)
  //       case "recent":
  //         return parseInt(b.createdAtTimestamp) - parseInt(a.createdAtTimestamp)
  //       default:
  //         return 0
  //     }
  //   })
  // }, [filteredApps, sortOption])

  const appsSection = useMemo(() => {
    if (isXAppsLoading) {
      return (
        <VStack w="full" spacing={12} h="80vh" justify="center" data-testid="apps-page-loading">
          <Spinner size="lg" />
        </VStack>
      )
    }

    return (
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6}>
        {/* TODO: add the new banner */}
        {displayApps.map(xApp => (
          <UnendorsedAppCard key={xApp.id} xApp={xApp} />
        ))}
      </Grid>
    )
  }, [displayApps, isXAppsLoading])

  return (
    <VStack spacing={8} data-testid="apps-page">
      <HStack
        w="full"
        overflowY="visible"
        overflowX="auto"
        spacing={4}
        justifyContent="space-between"
        css={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}>
        <HStack>
          <FilterAppsTypeButton filterType="All" currentFilter={filter} setFilter={setFilter} />
          <FilterAppsTypeButton filterType="Active apps" currentFilter={filter} setFilter={setFilter} />
          <FilterAppsTypeButton filterType="In grace period" currentFilter={filter} setFilter={setFilter} />
          <FilterAppsTypeButton filterType="Endorsement lost" currentFilter={filter} setFilter={setFilter} />
        </HStack>
        {/*
        <Menu>
          <MenuButton as={Button} rightIcon={<FaSortAmountDown />} color="#004CFC" fontSize="20px">
            {t("Sort by")}
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => handleSortChange("score")}>{t("Sort by score")}</MenuItem>
            <MenuItem onClick={() => handleSortChange("name")}>{t("Sort by name")}</MenuItem>
            <MenuItem onClick={() => handleSortChange("recent")}>{t("Sort by most recent")}</MenuItem>
          </MenuList>
        </Menu> */}
      </HStack>
      {appsSection}
    </VStack>
  )
}
