"use client"

import { Bleed, Box, Button, Dialog, Icon, Input, InputGroup, Presence, Tabs } from "@chakra-ui/react"
import { Search } from "iconoir-react"
import { useRef, useState } from "react"

import { useStickyState } from "@/hooks/useStickyState"

import { AppCategoryTabs, AppWithVotes } from "./AppCategoryTabs"
import { SearchAppsBottomSheet } from "./components/SearchAppsBottomSheet"

interface AllocationTabsProps {
  apps: AppWithVotes[]
  onSelectedAppsChange?: (selectedIds: Set<string>) => void
}

export function AllocationTabs({ apps, onSelectedAppsChange }: AllocationTabsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isStuck = useStickyState(sentinelRef)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set())

  const toggleApp = (appId: string) => {
    setSelectedAppIds(prev => {
      const next = new Set(prev)
      next.has(appId) ? next.delete(appId) : next.add(appId)
      onSelectedAppsChange?.(next)
      return next
    })
  }

  return (
    <>
      <Box ref={sentinelRef} height="1px" />

      <Tabs.Root defaultValue="tab1" variant="line" size="md" w="full" lazyMount>
        <Bleed position="sticky" top="0" zIndex={2} inlineStart="4" inlineEnd="4">
          <Tabs.List pt={isStuck ? "3" : undefined} px="4" bg={isStuck ? "bg.primary" : undefined}>
            <Tabs.Trigger flex={1} justifyContent="center" value="tab1">
              {"Vote for apps"}
            </Tabs.Trigger>
            <Tabs.Trigger flex={1} justifyContent="center" value="tab2">
              {"Round info"}
            </Tabs.Trigger>
          </Tabs.List>
        </Bleed>
        <Tabs.Content value="tab1" display="flex" flexDirection="column" gap="4">
          <InputGroup
            startElement={<Icon as={Search} boxSize="4" color="text.subtle" />}
            rounded="xl"
            borderColor="border.primary">
            <Input id="allocation-app-filter" placeholder="Search app" onFocus={() => setIsSearchOpen(true)} />
          </InputGroup>
          <Bleed inlineStart="4" inlineEnd="4">
            <AppCategoryTabs
              apps={apps}
              selectedAppIds={selectedAppIds}
              onToggleApp={toggleApp}
              showAdditionalTabs
              tabsListProps={{
                position: "sticky",
                top: "52px",
                py: isStuck ? "3" : undefined,
                px: "4",
                bg: isStuck ? "bg.primary" : undefined,
                zIndex: 2,
              }}
            />
          </Bleed>
        </Tabs.Content>
        <Tabs.Content value="tab2">{"Second tab content"}</Tabs.Content>
      </Tabs.Root>

      <SearchAppsBottomSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        apps={apps}
        selectedAppIds={selectedAppIds}
        onToggleApp={toggleApp}
      />

      <Presence
        present={selectedAppIds.size > 0}
        animationName={{
          _open: "slide-from-bottom",
          _closed: "slide-to-bottom, fade-out",
        }}
        animationDuration="fast"
        pos="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={50}>
        <Box p="4" bg="bg.primary" border="sm" borderColor="border.secondary">
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <Button w="full" variant="primary">
                {`Vote for ${selectedAppIds.size} App${selectedAppIds.size !== 1 ? "s" : ""}`}
              </Button>
            </Dialog.Trigger>
          </Dialog.Root>
        </Box>
      </Presence>
    </>
  )
}
