import {
  Box,
  HStack,
  VStack,
  Grid,
  Spinner,
  GridItem,
  InputGroup,
  Input,
  Center,
  Button,
  CloseButton,
} from "@chakra-ui/react"
import { UilSearch } from "@iconscout/react-unicons"
import { ethers } from "ethers"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AppStatusFilter, useAppsFilters } from "@/store/useAppsFilters"

import { UnendorsedApp, XApp } from "../../../../api/contracts/xApps/getXApps"
import { useGetUserNodes, UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"
import { usePagination } from "../../../../hooks/usePagination"
import { useFilteredApps } from "../../hooks/useFilteredApps"
import { AppsEmptyState } from "../AppsEmptyState"
import { CreatorBanner } from "../CreatorBanner"
import { UnendorsedAppCard } from "../UnendorsedAppCard"

import { FilteringMenu } from "./FilteringMenu"
import { SortingMenu } from "./SortingMenu"

type Props = {
  currentActiveApps: XApp[]
  newApps: UnendorsedApp[] | XApp[]
  gracePeriodApps: UnendorsedApp[]
  endorsementLostApps: UnendorsedApp[]
  isXAppsLoading: boolean
  headingComponent?: React.ReactNode
}

type LayoutKey = "endorser" | "default"

export const AllApps = ({
  currentActiveApps,
  newApps,
  gracePeriodApps,
  endorsementLostApps,
  isXAppsLoading,
  headingComponent,
}: Props) => {
  const { t } = useTranslation()
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()

  // Search state (local)
  const [searchQuery, setSearchQuery] = useState("")

  // Get filter state from store
  const { statusFilter, setStatusFilter, categoryFilters, toggleCategoryFilter, sortOption, setSortOption } =
    useAppsFilters()

  // Get filtered apps
  const {
    filteredApps,
    allApps,
    statusCounts,
    isLoading: isSortingLoading,
  } = useFilteredApps({
    currentActiveApps,
    newApps,
    gracePeriodApps,
    endorsementLostApps,
  })

  // Apply search on top of filtered apps (or search across all apps)
  const searchedApps = useMemo(() => {
    if (!searchQuery.trim()) return filteredApps

    const query = searchQuery.toLowerCase()
    // Search across ALL apps when there's a query
    return allApps.filter(app => app.name.toLowerCase().includes(query))
  }, [searchQuery, filteredApps, allApps])

  const isUserEndorsingAnyApp = useMemo(() => {
    return userNodesInfo?.nodesManagedByUser?.some((node: UserNode) => node.endorsedAppId !== ethers.ZeroHash)
  }, [userNodesInfo])

  const itemsPerPage = 25
  const { currentItems: displayAppsRestricted, hasMore, loadMore } = usePagination(searchedApps, itemsPerPage)

  const layout: LayoutKey = isUserEndorsingAnyApp ? "endorser" : "default"
  const showCreatorBanner = useMemo(
    () => (statusFilter === AppStatusFilter.All || statusFilter === AppStatusFilter.Active) && !searchQuery.trim(),
    [statusFilter, searchQuery],
  )

  const handleSortChange = (option: typeof sortOption) => {
    setSortOption(option === sortOption ? "default" : option)
  }

  const appsSection = useMemo(() => {
    const isEmpty = !displayAppsRestricted?.length
    const isLoading = isXAppsLoading || isSortingLoading || isUserNodesLoading

    return isLoading ? (
      <VStack w="full" gap={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size="lg" />
      </VStack>
    ) : (
      <VStack w="full" gap={4}>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} w="full" alignItems="center">
          {isEmpty ? (
            <GridItem colSpan={2}>
              <AppsEmptyState />
            </GridItem>
          ) : (
            <>
              {showCreatorBanner ? <CreatorBanner /> : undefined}
              {displayAppsRestricted.map(xApp => (
                <UnendorsedAppCard key={xApp.id} appId={xApp.id} isNewApp={xApp.isNew} layout={layout} />
              ))}
            </>
          )}
        </Grid>

        {hasMore && (
          <Center w="full" py={4}>
            <Button onClick={loadMore} variant="outline" size="md">
              {t("Load more")}
            </Button>
          </Center>
        )}
      </VStack>
    )
  }, [
    displayAppsRestricted,
    isXAppsLoading,
    isSortingLoading,
    isUserNodesLoading,
    showCreatorBanner,
    hasMore,
    loadMore,
    t,
    layout,
  ])

  return (
    <VStack gap={8} w="full" data-testid="apps-page">
      <HStack w="full" mt={0}>
        {headingComponent && <Box flexShrink={0}>{headingComponent}</Box>}
        <HStack w="full" flexDir="row-reverse" gap={4} ml={headingComponent ? "auto" : 0}>
          <HStack gap={2}>
            <SortingMenu sortOption={sortOption} onSortChange={handleSortChange} />
            <FilteringMenu
              selectedCategories={categoryFilters}
              statusFilter={statusFilter}
              appWithStatusCounts={statusCounts}
              onCategoryChange={toggleCategoryFilter}
              onStatusFilterChange={setStatusFilter}
            />
          </HStack>
          <InputGroup
            w={headingComponent ? "300px" : "full"}
            gap={2}
            startElement={<UilSearch pointerEvents="none" size="1rem" />}
            endElement={searchQuery ? <CloseButton onClick={() => setSearchQuery("")} /> : undefined}
            startElementProps={{ paddingInline: "3" }}
            inputMode="search">
            <Input
              h={12}
              bg="bg.primary"
              border="sm"
              borderColor="border.primary"
              variant="outline"
              borderRadius="xl"
              placeholder="Search apps..."
              _placeholder={{ color: "text.subtle" }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingInlineStart: "2.25rem" }}
              type="search"
            />
          </InputGroup>
        </HStack>
      </HStack>
      {appsSection}
    </VStack>
  )
}
