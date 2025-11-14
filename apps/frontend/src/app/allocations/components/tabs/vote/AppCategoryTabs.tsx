"use client"

import {
  Button,
  Circle,
  CloseButton,
  createListCollection,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  Pagination,
  Portal,
  Select,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Search, Search as SearchIcon } from "iconoir-react"
import { useMemo, useState } from "react"

import { useXAppsShares } from "@/api/contracts/xApps/hooks/useXAppShares"
import { AppWithVotes } from "@/app/allocations/lib/data"
import { EmptyState } from "@/components/ui/empty-state"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { APP_CATEGORIES } from "@/types/appDetails"

import { AppRadioCard } from "../../AppRadioCard"
import { UserTopVotedAppsCard } from "../../UserTopVotedAppsCard"

interface AppCategoryTabsProps {
  apps?: AppWithVotes[]
  searchQuery?: string
  selectedAppIds?: Set<string>
  onToggleApp?: (appId: string) => void
  tabsListProps?: Record<string, any>
  showEmptyState?: boolean
  showPagination?: boolean
  onViewAll?: VoidFunction
  initialCategory?: string
  onCategoryChange?: (category: string) => void
  hasEnoughVotesAtSnapshot?: boolean
  roundId?: string
  onVoteClick?: () => void
}

export function AppCategoryTabs({
  apps = [],
  searchQuery = "",
  selectedAppIds,
  onToggleApp,
  tabsListProps,
  showEmptyState = false,
  showPagination = false,
  onViewAll,
  initialCategory = "all",
  onCategoryChange,
  hasEnoughVotesAtSnapshot,
  roundId,
  onVoteClick,
}: AppCategoryTabsProps) {
  const { isMobile } = useBreakpoints()
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [searchQueryDesktop, setSearchQueryDesktop] = useState(searchQuery)
  const { data: appShares } = useXAppsShares(
    apps.map(app => app.id),
    roundId,
  )

  const categoryCollection = createListCollection({
    items: APP_CATEGORIES.map(category => ({ label: category.name, value: category.id })),
  })

  const appSharesMap = useMemo(() => {
    if (!appShares) return new Map()
    return new Map(appShares.map(share => [share.app, share.share + share.unallocatedShare]))
  }, [appShares])

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSearchDesktop = app.name.toLowerCase().includes(searchQueryDesktop.toLowerCase())

      const matchesCategory =
        selectedCategory === "all" || (app.metadata?.categories && app.metadata.categories.includes(selectedCategory))
      return (isMobile ? matchesSearch : matchesSearchDesktop) && matchesCategory
    })
  }, [apps, isMobile, searchQuery, searchQueryDesktop, selectedCategory])

  const areAllFilteredAppsSelected = useMemo(() => {
    if (!selectedAppIds || filteredApps.length === 0) return false
    return filteredApps.every(app => selectedAppIds.has(app.id))
  }, [filteredApps, selectedAppIds])

  const sortedAppsWithSelected = useMemo(() => {
    return filteredApps.slice().sort((a, b) => {
      const aSelected = selectedAppIds?.has(a.id) ?? false
      const bSelected = selectedAppIds?.has(b.id) ?? false
      if (aSelected === bSelected) return 0
      return aSelected ? -1 : 1
    })
  }, [filteredApps, selectedAppIds])

  const handleSelectAll = () => {
    if (!onToggleApp) return

    if (areAllFilteredAppsSelected) {
      filteredApps.forEach(app => {
        if (selectedAppIds?.has(app.id)) {
          onToggleApp(app.id)
        }
      })
    } else {
      filteredApps.forEach(app => {
        if (!selectedAppIds?.has(app.id)) {
          onToggleApp(app.id)
        }
      })
    }
  }

  return (
    <HStack asChild={isMobile} gap="6" alignItems="flex-start">
      <VStack flex={1} gap="4" align="stretch">
        <VStack hideBelow="md" gap="4" align="stretch" px="4">
          <Flex alignItems="center" justifyContent="space-between">
            <Heading size="lg">{"Active apps in current round"}</Heading>
            <Flex gap="4">
              <Button variant="link" p="0" color="text.default" fontWeight="semibold" onClick={handleSelectAll}>
                {areAllFilteredAppsSelected ? "Deselect all" : "Select all"}
              </Button>
              <Button
                variant="primary"
                minWidth="36"
                onClick={onVoteClick}
                disabled={!hasEnoughVotesAtSnapshot && selectedAppIds && selectedAppIds.size > 0}>
                {selectedAppIds && selectedAppIds.size > 0
                  ? selectedAppIds.size > 1
                    ? `Vote for ${selectedAppIds?.size} Apps`
                    : `Vote for 1 App`
                  : "Vote"}
              </Button>
            </Flex>
          </Flex>
          <Flex gap="4" alignItems="center" justifyContent="space-between">
            <InputGroup
              flex={1}
              startElement={<Icon as={Search} boxSize="4" color="text.subtle" />}
              endElement={
                searchQueryDesktop ? (
                  <CloseButton size="xs" onClick={() => setSearchQueryDesktop("")} me="-2" />
                ) : undefined
              }
              borderColor="border.primary">
              <Input
                id="allocation-app-filter-desktop"
                variant="outline"
                placeholder="Search app"
                value={searchQueryDesktop}
                onChange={e => setSearchQueryDesktop(e.target.value)}
                rounded="xl"
              />
            </InputGroup>
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
                  <Select.ValueText placeholder="Category" />
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
            </Select.Root>{" "}
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
              {"All"}
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
            {filteredApps.length > 0 ? (
              (showPagination ? sortedAppsWithSelected.slice(0, 10) : sortedAppsWithSelected).map(app => (
                <AppRadioCard
                  key={app.id}
                  appId={app.id}
                  appName={app.name}
                  appVoters={app.voters}
                  appCategory={APP_CATEGORIES.find(category => app.metadata?.categories[0] === category.id)}
                  allocationSharePercentage={appSharesMap.get(app.id)}
                  checked={selectedAppIds?.has(app.id)}
                  onCheckedChange={() => onToggleApp?.(app.id)}
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
                description="Hmm, we couldn't find that app. Please check the spelling."
              />
            ) : null}

            {showPagination && (
              <Pagination.Root
                defaultPage={1}
                count={filteredApps.length}
                pageSize={10}
                page={1}
                onPageChange={() => {}}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                gap="4">
                <HStack gap="1">
                  <Text textStyle="sm">{"Showing"}</Text>

                  <Pagination.PageText format="long" textStyle="sm" />
                </HStack>

                <Button hideFrom="md" variant="link" p="0" size="sm" onClick={onViewAll}>
                  {"View all"}
                </Button>
              </Pagination.Root>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
      {!isMobile && (
        <VStack width="1/3" align="stretch" justifySelf="flex-start">
          <Heading size="lg">{"Your top 5 Apps"}</Heading>
          <UserTopVotedAppsCard apps={apps} />
        </VStack>
      )}
    </HStack>
  )
}
