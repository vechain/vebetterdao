"use client"

import {
  Button,
  Circle,
  Collapsible,
  createListCollection,
  Flex,
  Heading,
  HStack,
  Icon,
  Portal,
  Select,
  Skeleton,
  Tabs,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { Search as SearchIcon } from "iconoir-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useXAppsSharesBasedOnMaxAllocation } from "@/api/contracts/xApps/hooks/useXAppSharesBasedOnMaxAllocation"
import { AppWithVotes } from "@/app/allocations/lib/data"
import { SearchField } from "@/components/SearchField/SearchField"
import { EmptyState } from "@/components/ui/empty-state"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { APP_CATEGORIES } from "@/types/appDetails"

import { AppRadioCard } from "../../AppRadioCard"
import { UserTopVotedAppsCard } from "../../UserTopVotedAppsCard"
import { VotingAlerts } from "../../VotingAlerts"

import { VoteButtons } from "./VoteButtons"

interface AppCategoryTabsProps {
  apps?: AppWithVotes[]
  searchQuery?: string
  selectedAppIds?: Set<string>
  onToggleApp?: (appId: string) => void
  tabsListProps?: Record<string, any>
  showEmptyState?: boolean
  initialCategory?: string
  onCategoryChange?: (category: string) => void
  roundId?: string
  hasVoted?: boolean
  isVoteDataLoading?: boolean
  isAutoVotingEnabled?: boolean
  isAutoVotingEnabledInCurrentRound?: boolean
  isEditingAutoVote?: boolean
  isAtSelectionLimit?: boolean
  disabled?: boolean
}

const categoryCollection = createListCollection({
  items: APP_CATEGORIES.map(category => ({ label: category.name, value: category.id })),
})

const INITIALLY_VISIBLE_APP_COUNT = 10

export function AppCategoryTabs({
  apps = [],
  searchQuery = "",
  selectedAppIds,
  onToggleApp,
  tabsListProps,
  showEmptyState = false,
  initialCategory = "all",
  onCategoryChange,
  roundId,
  hasVoted = false,
  isVoteDataLoading = false,
  isAutoVotingEnabled = false,
  isAutoVotingEnabledInCurrentRound = false,
  isEditingAutoVote = false,
  isAtSelectionLimit = false,
  disabled = false,
}: AppCategoryTabsProps) {
  const { isMobile } = useBreakpoints()
  const { account } = useWallet()
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [searchQueryDesktop, setSearchQueryDesktop] = useState(searchQuery)
  const [viewAll, setViewAll] = useState(false)
  const { t } = useTranslation()

  const { data: appSharesMap = new Map() } = useXAppsSharesBasedOnMaxAllocation(
    apps.map(app => app.id),
    roundId ?? "",
  )

  const filteredApps = useMemo(() => {
    const trimmedSearchQuery = searchQuery.trim()
    const trimmedSearchQueryDesktop = searchQueryDesktop.trim()

    return apps.filter(app => {
      const matchesSearch = !trimmedSearchQuery || app.name.toLowerCase().includes(trimmedSearchQuery.toLowerCase())
      const matchesSearchDesktop =
        !trimmedSearchQueryDesktop || app.name.toLowerCase().includes(trimmedSearchQueryDesktop.toLowerCase())

      const matchesCategory =
        selectedCategory === "all" || (app.metadata?.categories && app.metadata.categories.includes(selectedCategory))
      return (isMobile ? matchesSearch : matchesSearchDesktop) && matchesCategory
    })
  }, [apps, isMobile, searchQuery, searchQueryDesktop, selectedCategory])

  return (
    <HStack asChild={isMobile} gap="6" alignItems="flex-start">
      <VStack flex={1} gap="4" align="stretch">
        <VStack hideBelow="md" gap="4" align="stretch" px="4">
          <VotingAlerts />
          <Flex alignItems="center" justifyContent="space-between">
            <Heading size="lg">{t("Active apps in current round")}</Heading>
            {!!account?.address && <VoteButtons variant="desktop" />}
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
            key={selectedCategory}
            value={selectedCategory}
            display="flex"
            flexDirection="column"
            gap={tabsListProps?.mb ? "3" : "4"}
            p={tabsListProps?.mb ? undefined : "4"}
            _open={{
              animationName: "fade-in",
              animationDuration: "750ms",
            }}>
            {isVoteDataLoading ? (
              // Show skeleton cards while vote data is loading (matches AppRadioCard styling)
              Array.from({ length: filteredApps.length || 5 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={index} height={{ base: "70px", md: "84px" }} rounded="lg" />
              ))
            ) : filteredApps.length > 0 ? (
              filteredApps
                .slice(0, INITIALLY_VISIBLE_APP_COUNT)
                .map(app => (
                  <AppRadioCard
                    key={app.id}
                    appId={app.id}
                    appLogo={app.metadata?.logo}
                    appName={app.name}
                    appVoters={app.voters}
                    appCategory={APP_CATEGORIES.find(category => app.metadata?.categories?.[0] === category.id)}
                    allocationSharePercentage={appSharesMap.get(app.id)}
                    checked={selectedAppIds?.has(app.id)}
                    onCheckedChange={() => onToggleApp?.(app.id)}
                    displayMode={
                      !account?.address ||
                      disabled ||
                      ((hasVoted || isAutoVotingEnabled || isAutoVotingEnabledInCurrentRound) && !isEditingAutoVote)
                        ? "voted"
                        : "checkbox"
                    }
                    disabled={isAtSelectionLimit && !selectedAppIds?.has(app.id)}
                  />
                ))
            ) : (isMobile ? searchQuery.trim().length > 0 : searchQueryDesktop.trim().length > 0) && showEmptyState ? (
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

            <Collapsible.Root
              open={viewAll}
              onOpenChange={details => setViewAll(details.open)}
              onExitComplete={() =>
                document.getElementById("tabs:allocation-tabs")?.scrollIntoView({ behavior: "smooth" })
              }>
              <Collapsible.Content display="flex" flexDirection="column" gap="4">
                {filteredApps.slice(INITIALLY_VISIBLE_APP_COUNT).map(app => (
                  <AppRadioCard
                    key={app.id}
                    appId={app.id}
                    appLogo={app.metadata?.logo}
                    appName={app.name}
                    appVoters={app.voters}
                    appCategory={APP_CATEGORIES.find(category => app.metadata?.categories?.[0] === category.id)}
                    allocationSharePercentage={appSharesMap.get(app.id)}
                    checked={selectedAppIds?.has(app.id)}
                    onCheckedChange={() => onToggleApp?.(app.id)}
                    displayMode={
                      !account?.address ||
                      disabled ||
                      ((hasVoted || isAutoVotingEnabled || isAutoVotingEnabledInCurrentRound) && !isEditingAutoVote)
                        ? "voted"
                        : "checkbox"
                    }
                    disabled={isAtSelectionLimit && !selectedAppIds?.has(app.id)}
                  />
                ))}
              </Collapsible.Content>
              {filteredApps.length > INITIALLY_VISIBLE_APP_COUNT && (
                <Collapsible.Trigger asChild>
                  <Button
                    mt={viewAll ? "4" : "unset"}
                    mx={{ base: "auto", md: "auto 0" }}
                    height="5"
                    flexShrink={0}
                    variant="link"
                    p="0"
                    size="sm">
                    {viewAll ? t("View less") : t("View all")}
                  </Button>
                </Collapsible.Trigger>
              )}
            </Collapsible.Root>
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
