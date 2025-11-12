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
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { FILTER_ACTIVE_APPS } from "@/types/appDetails"

import { UnendorsedApp, XApp } from "../../../../api/contracts/xApps/getXApps"
import { useNodesEndorsedApps } from "../../../../api/contracts/xApps/hooks/endorsement/useUserNodesEndorsement"
import { useGetUserNodes } from "../../../../api/contracts/xNodes/useGetUserNodes"
import { usePagination } from "../../../../hooks/usePagination"
import { useAppsFiltering } from "../../hooks/useAppsFiltering"
import { useAppsSearch } from "../../hooks/useAppsSearch"
import { useAppsSorting } from "../../hooks/useAppsSorting"
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
  const { data: nodes } = useGetUserNodes()
  const { data: endorsedApps } = useNodesEndorsedApps(nodes?.nodes?.map((node: any) => node.id.toString()) ?? [])
  const isEndorsingApp = endorsedApps?.length && endorsedApps?.length > 0

  const { sortOption, sortedApps, appWithStatusCounts, isSorting, onSortChange } = useAppsSorting(
    currentActiveApps,
    newApps,
    gracePeriodApps,
    endorsementLostApps,
  )
  const { searchQuery, handleSearchChange, clearSearch } = useAppsSearch()
  const { setStatusFilter, toggleCategoryFilter, filteredApps, statusFilterOptions, statusFilter } = useAppsFiltering(
    sortedApps,
    sortOption,
    searchQuery,
  )

  const itemsPerPage = 25
  const { currentItems: displayAppsRestricted, hasMore, loadMore } = usePagination(filteredApps, itemsPerPage)

  const layout: LayoutKey = isEndorsingApp ? "endorser" : "default"
  const showCreatorBanner = useMemo(() => statusFilter === FILTER_ACTIVE_APPS, [statusFilter])

  // State for selected categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev: string[]) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id: string) => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
    toggleCategoryFilter(categoryId)
  }

  const appsSection = useMemo(() => {
    const isEmpty = !displayAppsRestricted?.length // if no apps, show empty state
    return isXAppsLoading || isSorting ? (
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
            <Button onClick={loadMore} variant="secondary" size="md">
              {t("Load more")}
            </Button>
          </Center>
        )}
      </VStack>
    )
  }, [t, displayAppsRestricted, isXAppsLoading, isSorting, showCreatorBanner, layout, hasMore, loadMore])

  return (
    <VStack gap={8} w="full" data-testid="apps-page">
      <HStack w="full" mt={0}>
        {headingComponent && <Box flexShrink={0}>{headingComponent}</Box>}
        <HStack w="full" flexDir="row-reverse" gap={4} ml={headingComponent ? "auto" : 0}>
          <HStack gap={2}>
            <SortingMenu sortOption={sortOption} onSortChange={onSortChange} />
            <FilteringMenu
              selectedCategories={selectedCategories}
              statusFilter={statusFilter}
              statusFilterOptions={statusFilterOptions}
              appWithStatusCounts={appWithStatusCounts}
              onCategoryChange={handleCategoryChange}
              onStatusFilterChange={setStatusFilter}
            />
          </HStack>
          <InputGroup
            w={headingComponent ? "300px" : "full"}
            gap={2}
            startElement={<UilSearch pointerEvents="none" size="1rem" />}
            endElement={searchQuery ? <CloseButton onClick={clearSearch} /> : undefined}
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
