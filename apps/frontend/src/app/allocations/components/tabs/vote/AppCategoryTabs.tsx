"use client"

import {
  Button,
  ButtonGroup,
  Circle,
  createListCollection,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Pagination,
  Portal,
  Select,
  Skeleton,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { Search as SearchIcon } from "iconoir-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2"

import { useXAppsSharesBasedOnMaxAllocation } from "@/api/contracts/xApps/hooks/useXAppSharesBasedOnMaxAllocation"
import { AppWithVotes } from "@/app/allocations/lib/data"
import { SearchField } from "@/components/SearchField/SearchField"
import { EmptyState } from "@/components/ui/empty-state"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { APP_CATEGORIES } from "@/types/appDetails"

import { AppRadioCard } from "../../AppRadioCard"
import { UserTopVotedAppsCard } from "../../UserTopVotedAppsCard"
import { VotingAlerts } from "../../VotingAlerts"
import { MAX_SELECTED_APPS } from "../AllocationTabsProvider"

import { VoteButtons } from "./VoteButtons"

interface AppCategoryTabsProps {
  apps?: AppWithVotes[]
  searchQuery?: string
  selectedAppIds?: Set<string>
  selectionOrder?: string[]
  onToggleApp?: (appId: string) => void
  tabsListProps?: Record<string, any>
  showEmptyState?: boolean
  showPagination?: boolean
  onViewAll?: VoidFunction
  initialCategory?: string
  onCategoryChange?: (category: string) => void
  roundId?: string
  hasVoted?: boolean
  isVoteDataLoading?: boolean
  isAutoVotingEnabled?: boolean
  isAutoVotingEnabledInCurrentRound?: boolean
  isEditingAutoVote?: boolean
  isAtSelectionLimit?: boolean
}

const categoryCollection = createListCollection({
  items: APP_CATEGORIES.map(category => ({ label: category.name, value: category.id })),
})

export function AppCategoryTabs({
  apps = [],
  searchQuery = "",
  selectedAppIds,
  selectionOrder = [],
  onToggleApp,
  tabsListProps,
  showEmptyState = false,
  showPagination = false,
  onViewAll,
  initialCategory = "all",
  onCategoryChange,
  roundId,
  hasVoted = false,
  isVoteDataLoading = false,
  isAutoVotingEnabled = false,
  isAutoVotingEnabledInCurrentRound = false,
  isEditingAutoVote = false,
  isAtSelectionLimit = false,
}: AppCategoryTabsProps) {
  const { isMobile } = useBreakpoints()
  const { account } = useWallet()
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [searchQueryDesktop, setSearchQueryDesktop] = useState(searchQuery)
  const [currentPage, setCurrentPage] = useState(1)
  const { t } = useTranslation()

  const { data: appSharesMap = new Map() } = useXAppsSharesBasedOnMaxAllocation(
    apps.map(app => app.id),
    roundId ?? "",
  )

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSearchDesktop = app.name.toLowerCase().includes(searchQueryDesktop.toLowerCase())

      const matchesCategory =
        selectedCategory === "all" || (app.metadata?.categories && app.metadata.categories.includes(selectedCategory))
      return (isMobile ? matchesSearch : matchesSearchDesktop) && matchesCategory
    })
  }, [apps, isMobile, searchQuery, searchQueryDesktop, selectedCategory])

  // Sort selected apps to top, preserving selection order (append behavior)
  const sortedAppsWithSelected = useMemo(() => {
    return filteredApps.slice().sort((a, b) => {
      const aSelected = selectedAppIds?.has(a.id) ?? false
      const bSelected = selectedAppIds?.has(b.id) ?? false

      // Both selected: sort by selection order (earlier selections first)
      if (aSelected && bSelected) {
        const aIndex = selectionOrder.indexOf(a.id)
        const bIndex = selectionOrder.indexOf(b.id)
        return aIndex - bIndex
      }

      // One selected, one not: selected goes first
      if (aSelected !== bSelected) {
        return aSelected ? -1 : 1
      }

      // Both unselected: keep original order
      return 0
    })
  }, [filteredApps, selectedAppIds, selectionOrder])

  const visibleApps = useMemo(() => {
    if (!showPagination) return sortedAppsWithSelected
    const pageSize = 10
    const startIndex = (currentPage - 1) * pageSize
    return sortedAppsWithSelected.slice(startIndex, startIndex + pageSize)
  }, [sortedAppsWithSelected, showPagination, currentPage])

  const areAllVisibleAppsSelected = useMemo(() => {
    if (!selectedAppIds || visibleApps.length === 0) return false
    return visibleApps.every(app => selectedAppIds.has(app.id))
  }, [visibleApps, selectedAppIds])

  const handleSelectAll = () => {
    if (!onToggleApp) return

    if (areAllVisibleAppsSelected) {
      // Deselect all visible apps
      visibleApps.forEach(app => {
        if (selectedAppIds?.has(app.id)) {
          onToggleApp(app.id)
        }
      })
    } else {
      // Select up to the limit
      const currentCount = selectedAppIds?.size ?? 0
      let addedCount = 0

      visibleApps.forEach(app => {
        if (!selectedAppIds?.has(app.id) && currentCount + addedCount < MAX_SELECTED_APPS) {
          onToggleApp(app.id)
          addedCount++
        }
      })
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory])

  return (
    <HStack asChild={isMobile} gap="6" alignItems="flex-start">
      <VStack flex={1} gap="4" align="stretch">
        <VStack hideBelow="md" gap="4" align="stretch" px="4">
          <VotingAlerts />
          <Flex alignItems="center" justifyContent="space-between">
            <Heading size="lg">{t("Active apps in current round")}</Heading>
            {!!account?.address && (
              <Flex gap="4">
                {/* Show select all only when user can select apps (not in voted/auto-vote view mode) */}
                {((!hasVoted && !isAutoVotingEnabled && !isAutoVotingEnabledInCurrentRound) || isEditingAutoVote) && (
                  <Button variant="link" p="0" color="text.default" fontWeight="semibold" onClick={handleSelectAll}>
                    {areAllVisibleAppsSelected ? t("Deselect all") : t("Select all")}
                  </Button>
                )}
                <VoteButtons variant="desktop" />
              </Flex>
            )}
          </Flex>
          <Flex gap="4" alignItems="center" justifyContent="space-between">
            <SearchField placeholder={t("Search app")} value={searchQueryDesktop} onChange={setSearchQueryDesktop} />
            <Select.Root
              collection={categoryCollection}
              width="40"
              value={[selectedCategory]}
              onValueChange={e => {
                if (!e.value[0]) return
                setSelectedCategory(e.value[0])
                onCategoryChange?.(e.value[0])
              }}>
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder={t("Category")} />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  {selectedCategory !== "all" ? (
                    <Select.ClearTrigger
                      onClick={() => {
                        setSelectedCategory("all")
                        onCategoryChange?.("")
                      }}
                    />
                  ) : (
                    <Select.Indicator />
                  )}
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {categoryCollection.items.map(category => (
                      <Select.Item item={category} key={category.value}>
                        {category.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Flex>
        </VStack>
        <Tabs.Root
          value={selectedCategory}
          onValueChange={e => {
            setSelectedCategory(e.value)
            onCategoryChange?.(e.value)
          }}
          variant="subtle"
          colorPalette="actions.secondary"
          size="md"
          w="full">
          <Tabs.List
            hideFrom="md"
            w="full"
            overflowY="hidden"
            overflowX="scroll"
            gap="2"
            scrollbar="hidden"
            {...tabsListProps}>
            <Tabs.Trigger key="all" flex={1} justifyContent="center" value="all" minWidth="4rem">
              {t("All")}
            </Tabs.Trigger>
            {APP_CATEGORIES.map(({ id, name }) => (
              <Tabs.Trigger key={id} flex={1} justifyContent="center" value={id} minWidth="max-content">
                {name}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content
            value={selectedCategory}
            display="flex"
            flexDirection="column"
            gap={tabsListProps?.mb ? "3" : "4"}
            p={tabsListProps?.mb ? undefined : "4"}>
            {isVoteDataLoading ? (
              // Show skeleton cards while vote data is loading (matches AppRadioCard styling)
              Array.from({ length: visibleApps.length || 5 }).map((_, index) => (
                <Skeleton key={index} height={{ base: "70px", md: "84px" }} rounded="lg" />
              ))
            ) : filteredApps.length > 0 ? (
              visibleApps.map(app => (
                <AppRadioCard
                  key={app.id}
                  appId={app.id}
                  appLogo={app.metadata?.logo}
                  appName={app.name}
                  appVoters={app.voters}
                  appCategory={APP_CATEGORIES.find(category => app.metadata?.categories[0] === category.id)}
                  allocationSharePercentage={appSharesMap.get(app.id)}
                  checked={selectedAppIds?.has(app.id)}
                  onCheckedChange={() => onToggleApp?.(app.id)}
                  displayMode={
                    !account?.address ||
                    ((hasVoted || isAutoVotingEnabled || isAutoVotingEnabledInCurrentRound) && !isEditingAutoVote)
                      ? "voted"
                      : "checkbox"
                  }
                  disabled={isAtSelectionLimit && !selectedAppIds?.has(app.id)}
                />
              ))
            ) : searchQuery.length > 0 && showEmptyState ? (
              <EmptyState
                bgColor="transparent"
                icon={
                  <Circle width="100px" height="100px" bgColor="status.neutral.subtle">
                    <Icon as={SearchIcon} boxSize={16} color="actions.disabled.text" />
                  </Circle>
                }
                title={""}
                description={t("Hmm, we couldn't find that app. Please check the spelling.")}
              />
            ) : null}

            {showPagination && (
              <Pagination.Root
                defaultPage={1}
                count={filteredApps.length}
                pageSize={10}
                page={currentPage}
                onPageChange={details => setCurrentPage(details.page)}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap="4">
                <HStack gap="1">
                  <Text textStyle="sm">{t("Showing")}</Text>

                  <Pagination.PageText format="long" textStyle="sm" />
                </HStack>

                <ButtonGroup hideBelow="md" variant="ghost" size="sm">
                  <Pagination.PrevTrigger asChild>
                    <IconButton>
                      <HiChevronLeft />
                    </IconButton>
                  </Pagination.PrevTrigger>
                  <Pagination.Items
                    render={page => (
                      <IconButton variant={{ base: "ghost", _selected: "outline" }}>{page.value}</IconButton>
                    )}
                  />
                  <Pagination.NextTrigger asChild>
                    <IconButton>
                      <HiChevronRight />
                    </IconButton>
                  </Pagination.NextTrigger>
                </ButtonGroup>

                <Button hideFrom="md" variant="link" p="0" size="sm" onClick={onViewAll}>
                  {t("View all")}
                </Button>
              </Pagination.Root>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </VStack>

      {!isMobile && !!account?.address && (
        <VStack width="1/3" align="stretch" justifySelf="flex-start">
          <Heading size="lg">{t("Your top 5 Apps")}</Heading>
          <UserTopVotedAppsCard apps={apps} />
        </VStack>
      )}
    </HStack>
  )
}
