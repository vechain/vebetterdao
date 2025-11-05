"use client"

import { CheckboxCard, Circle, Flex, Heading, Icon, Progress, Tabs, Text } from "@chakra-ui/react"
import { Group, Search as SearchIcon } from "iconoir-react"
import { useMemo, useState } from "react"

import { AppImage } from "@/components/AppImage/AppImage"
import { EmptyState } from "@/components/ui/empty-state"
import { useDebounce } from "@/hooks/useDebounce"
import { APP_CATEGORIES } from "@/types/appDetails"

export interface AppWithVotes {
  id: string
  name: string
  voters?: number
  votesReceived?: number
  // TODO: this is temporary
  metadata?: {
    categories?: string[]
  }
}

interface AppCategoryTabsProps {
  apps?: AppWithVotes[]
  searchQuery?: string
  selectedAppIds?: Set<string>
  onToggleApp?: (appId: string) => void
  tabsListProps?: Record<string, any>
  showAdditionalTabs?: boolean
  showEmptyState?: boolean
}

export function AppCategoryTabs({
  apps = [],
  searchQuery = "",
  selectedAppIds,
  onToggleApp,
  tabsListProps,
  showAdditionalTabs = false,
  showEmptyState = false,
}: AppCategoryTabsProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const totalVotes = useMemo(
    () =>
      apps.reduce((acc, cum) => {
        return acc + (cum?.votesReceived ? Number(cum.votesReceived) : 0)
      }, 0),
    [apps],
  )

  const filteredApps = useMemo(() => {
    return apps
      .filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        const matchesCategory =
          selectedCategory === "all" || (app.metadata?.categories && app.metadata.categories.includes(selectedCategory))
        return matchesSearch && matchesCategory
      })
      .sort((a, b) => (b.votesReceived ?? 0) - (a.votesReceived ?? 0))
  }, [apps, debouncedSearchQuery, selectedCategory])

  return (
    <Tabs.Root
      value={selectedCategory}
      onValueChange={e => setSelectedCategory(e.value)}
      variant="subtle"
      colorPalette="actions.secondary"
      size="md"
      w="full">
      <Tabs.List w="full" overflowY="hidden" overflowX="scroll" gap="2" scrollbar="hidden" {...tabsListProps}>
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
          filteredApps.map(app => (
            <CheckboxCard.Root
              key={app.id}
              rounded="lg"
              p="3"
              colorPalette="blue"
              checked={selectedAppIds?.has(app.id) ?? false}
              onCheckedChange={() => onToggleApp?.(app.id)}>
              <CheckboxCard.HiddenInput />
              <CheckboxCard.Control alignItems="center" p="0" gap="3">
                <CheckboxCard.Indicator rounded="sm" />
                <AppImage appId={app.id} gridRow="1 / 3" />
                <CheckboxCard.Content gap="0.5">
                  <Heading fontSize="md">{app.name}</Heading>
                  <Flex w="full" justifyContent="space-between">
                    <Text display="flex" gap="2" textStyle="xs">
                      <Icon as={Group} boxSize="4" />
                      {app.voters ?? 0}
                    </Text>
                    <Text textStyle="xs" fontWeight="bold">
                      {(app.votesReceived ?? 0) > 0
                        ? `${(((app?.votesReceived || 0) / totalVotes) * 100).toFixed(2)}%`
                        : "0%"}
                    </Text>
                  </Flex>
                  <Progress.Root w="full" size="xs" colorPalette="green" mt="1" value={50}>
                    <Progress.Track rounded="lg">
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                </CheckboxCard.Content>
              </CheckboxCard.Control>
            </CheckboxCard.Root>
          ))
        ) : debouncedSearchQuery.length > 0 && showEmptyState ? (
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
      </Tabs.Content>

      {showAdditionalTabs && (
        <>
          <Tabs.Content value="tab1" display="flex" flexDirection="column" gap="4">
            {"First tab content"}
          </Tabs.Content>
          <Tabs.Content value="tab2">{"Second tab content"}</Tabs.Content>
        </>
      )}
    </Tabs.Root>
  )
}
