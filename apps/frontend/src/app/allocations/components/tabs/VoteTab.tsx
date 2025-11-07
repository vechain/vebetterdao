"use client"

import { Bleed, Icon, Input, InputGroup } from "@chakra-ui/react"
import { Search } from "iconoir-react"
import { useCallback, useState } from "react"

import type { AppWithVotes } from "../../page"

import { AppCategoryTabs } from "./AppCategoryTabs"
import { SearchAppsBottomSheet } from "./components/SearchAppsBottomSheet"

interface VoteTabProps {
  apps: AppWithVotes[]
  selectedAppIds: Set<string>
  onToggleApp: (appId: string) => void
  isStuck: boolean
}

export function VoteTab({ apps, selectedAppIds, onToggleApp, isStuck }: VoteTabProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleViewAll = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  return (
    <>
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
          onToggleApp={onToggleApp}
          onViewAll={handleViewAll}
          showAdditionalTabs
          tabsListProps={{
            position: "sticky",
            top: "52px",
            py: isStuck ? "3" : undefined,
            px: "4",
            bg: isStuck ? "bg.primary" : undefined,
            zIndex: 2,
          }}
          showPagination
        />
      </Bleed>

      <SearchAppsBottomSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        apps={apps}
        selectedAppIds={selectedAppIds}
        onToggleApp={onToggleApp}
      />
    </>
  )
}
