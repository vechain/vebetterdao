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
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { AppStatusFilter, useAppsFilters } from "@/store/useAppsFilters"

import { UnendorsedApp, XApp } from "../../../../api/contracts/xApps/getXApps"
import { useDebounce } from "../../../../hooks/useDebounce"
import { usePagination } from "../../../../hooks/usePagination"
import { useFilteredApps } from "../../hooks/useFilteredApps"
import { AppsEmptyState } from "../AppsEmptyState"
import { CreatorApplyNow } from "../creatorBanners/CreatorApplyNow"
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

export const AllApps = ({
  currentActiveApps,
  newApps,
  gracePeriodApps,
  endorsementLostApps,
  isXAppsLoading,
  headingComponent,
}: Props) => {
  const { t } = useTranslation()

  // Search state with debounce
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Search helpers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchTerm("")
  }, [])

  // Get filter state from store
  const { statusFilter, setStatusFilter, categoryFilters, toggleCategoryFilter, sortOption, setSortOption } =
    useAppsFilters()

  // Get filtered apps
  const {
    filteredApps,
    searchApps,
    statusCounts,
    isLoading: isSortingLoading,
  } = useFilteredApps({
    currentActiveApps,
    newApps,
    gracePeriodApps,
    endorsementLostApps,
  })

  // Apply debounced search on top of filtered apps (or search across all apps)
  const searchedApps = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return filteredApps

    const query = debouncedSearchTerm.toLowerCase()
    // Search across ALL apps when there's a query
    return searchApps.filter(app => app.name.toLowerCase().includes(query))
  }, [debouncedSearchTerm, filteredApps, searchApps])

  const itemsPerPage = 25
  const { currentItems: displayAppsRestricted, hasMore, loadMore } = usePagination(searchedApps, itemsPerPage)

  const showCreatorBanner = useMemo(
    () =>
      (statusFilter === AppStatusFilter.All || statusFilter === AppStatusFilter.Active) && !debouncedSearchTerm.trim(),
    [statusFilter, debouncedSearchTerm],
  )

  const handleSortChange = (option: typeof sortOption) => {
    setSortOption(option === sortOption ? "default" : option)
  }

  const appsSection = useMemo(() => {
    const isEmpty = !displayAppsRestricted?.length
    const isLoading = isXAppsLoading || isSortingLoading

    return isLoading ? (
      <VStack w="full" gap={12} h="80vh" justify="center" data-testid="apps-page-loading">
        <Spinner size="lg" />
      </VStack>
    ) : (
      <VStack w="full" gap={4}>
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4} w="full" alignItems="stretch">
          {isEmpty ? (
            <GridItem colSpan={2}>
              <AppsEmptyState />
            </GridItem>
          ) : (
            <>
              {showCreatorBanner ? <CreatorApplyNow /> : undefined}
              {displayAppsRestricted.map(xApp => (
                <UnendorsedAppCard key={xApp.id} appId={xApp.id} isNewApp={xApp.isNew} />
              ))}
            </>
          )}
        </Grid>

        {hasMore && (
          <Center w="full" py={4}>
            <Button onClick={loadMore} variant="secondary" size="md">
              {t("Load more")}
            </Button>
          </Center>
        )}
      </VStack>
    )
  }, [displayAppsRestricted, isXAppsLoading, isSortingLoading, showCreatorBanner, hasMore, loadMore, t])

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
            endElement={searchTerm ? <CloseButton onClick={clearSearch} /> : undefined}
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
              value={searchTerm}
              onChange={handleSearchChange}
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
