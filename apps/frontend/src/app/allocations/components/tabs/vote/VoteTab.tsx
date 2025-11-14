"use client"

import { Bleed, Icon, Input, InputGroup } from "@chakra-ui/react"
import { Search } from "iconoir-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useVotingThreshold } from "@/api/contracts/governance/hooks/useVotingThreshold"

import type { AppWithVotes } from "../../../page"
import { AllocationAlertCard } from "../../AllocationAlertCard"
import { SearchAppsBottomSheet } from "../../SearchAppsBottomSheet"

import { AppCategoryTabs } from "./AppCategoryTabs"

interface VoteTabProps {
  apps: AppWithVotes[]
  selectedAppIds: Set<string>
  onToggleApp: (appId: string) => void
  isStuck: boolean
  hasEnoughVotesAtSnapshot: boolean
  roundId?: string
}

export function VoteTab({
  apps,
  selectedAppIds,
  onToggleApp,
  isStuck,
  hasEnoughVotesAtSnapshot,
  roundId,
}: VoteTabProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlSearchQuery = searchParams.get("search") || ""
  const selectedCategory = searchParams.get("category") || "all"
  const isSearchOpen = searchParams.has("search")
  const { t } = useTranslation()
  const { data: threshold } = useVotingThreshold()

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
      {selectedAppIds && selectedAppIds.size > 0 && !hasEnoughVotesAtSnapshot && (
        <AllocationAlertCard
          status="error"
          title={t("Not enough voting power to vote")}
          message={t("You need at least {{threshold}} voting power to participate. Power up your balance!", {
            threshold: threshold ?? "1",
          })}
        />
      )}
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
          hasEnoughVotesAtSnapshot={hasEnoughVotesAtSnapshot}
          roundId={roundId}
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
