"use client"

import { Bleed, Icon, Input, InputGroup } from "@chakra-ui/react"
import { Search } from "iconoir-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

import type { AppWithVotes } from "../../../page"
import { SearchAppsBottomSheet } from "../components/SearchAppsBottomSheet"

import { AppCategoryTabs } from "./AppCategoryTabs"

interface VoteTabProps {
  apps: AppWithVotes[]
  selectedAppIds: Set<string>
  onToggleApp: (appId: string) => void
  isStuck: boolean
}

export function VoteTab({ apps, selectedAppIds, onToggleApp, isStuck }: VoteTabProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlSearchQuery = searchParams.get("search") || ""
  const selectedCategory = searchParams.get("category") || "all"
  const isSearchOpen = searchParams.has("search")

  const handleSearchChange = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams)
      params.set("search", query)
      router.replace(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  const handleViewAll = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.set("search", "")
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const handleCloseSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.delete("search")
    router.push(`?${params.toString()}`)
  }, [searchParams, router])

  const handleCategoryChange = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams)
      if (category !== "all") {
        params.set("category", category)
      } else {
        params.delete("category")
      }
      router.push(`?${params.toString()}`)
    },
    [searchParams, router],
  )

  return (
    <>
      <InputGroup
        hideFrom="md"
        startElement={<Icon as={Search} boxSize="4" color="text.subtle" />}
        rounded="xl"
        borderColor="border.primary">
        <Input
          id="allocation-app-filter"
          placeholder="Search app"
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={handleViewAll}
        />
      </InputGroup>
      <Bleed inlineStart="4" inlineEnd="4">
        <AppCategoryTabs
          apps={apps}
          selectedAppIds={selectedAppIds}
          onToggleApp={onToggleApp}
          onViewAll={handleViewAll}
          initialCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={urlSearchQuery}
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
        onClose={handleCloseSearch}
        searchQuery={urlSearchQuery}
        onSearchChange={handleSearchChange}
        apps={apps}
        selectedAppIds={selectedAppIds}
        onToggleApp={onToggleApp}
      />
    </>
  )
}
