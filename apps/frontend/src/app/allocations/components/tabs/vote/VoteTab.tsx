"use client"

import { Bleed, Icon, Input, InputGroup } from "@chakra-ui/react"
import { Search } from "iconoir-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext } from "react"

import { useVotingThreshold } from "@/api/contracts/governance/hooks/useVotingThreshold"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { SearchAppsBottomSheet } from "../../SearchAppsBottomSheet"
import { VotingAlerts } from "../../VotingAlerts"
import { AllocationTabsContext } from "../AllocationTabsProvider"

import { AppCategoryTabs } from "./AppCategoryTabs"

export function VoteTab() {
  const context = useContext(AllocationTabsContext)
  if (!context) throw new Error("VoteTab must be used within AllocationTabsProvider")

  const {
    apps,
    roundId,
    selectedAppIds,
    selectionOrder,
    onToggleApp,
    isStuck,
    hasEnoughVotesAtSnapshot,
    onVoteClick,
    hasVoted,
    hasVotedLoading,
    isAutoVotingEnabled,
    isEditingAutoVote,
    onEditAutoVote,
    onCancelEditAutoVote,
    onSaveAutoVote,
    hasAutoVoteChanges,
    hasExistingPreferences,
    onEnableAutoVoting,
    isAtSelectionLimit,
  } = context
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const urlSearchQuery = searchParams.get("search") || ""
  const selectedCategory = searchParams.get("category") || "all"
  const isSearchOpen = searchParams.has("search")
  const { data: threshold } = useVotingThreshold()
  const { isMobile } = useBreakpoints()

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
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router],
  )

  return (
    <>
      {isMobile && (
        <VotingAlerts
          hasVoted={hasVoted ?? false}
          hasVotedLoading={hasVotedLoading}
          selectedAppIds={selectedAppIds}
          hasEnoughVotesAtSnapshot={hasEnoughVotesAtSnapshot}
          threshold={threshold}
          isAtSelectionLimit={isAtSelectionLimit}
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
          selectionOrder={selectionOrder}
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
          onVoteClick={onVoteClick}
          hasVoted={hasVoted}
          hasVotedLoading={hasVotedLoading}
          threshold={threshold}
          isAutoVotingEnabled={isAutoVotingEnabled}
          isEditingAutoVote={isEditingAutoVote}
          onEditAutoVote={onEditAutoVote}
          onCancelEditAutoVote={onCancelEditAutoVote}
          onSaveAutoVote={onSaveAutoVote}
          hasAutoVoteChanges={hasAutoVoteChanges}
          hasExistingPreferences={hasExistingPreferences}
          onEnableAutoVoting={onEnableAutoVoting}
          isAtSelectionLimit={isAtSelectionLimit}
        />
      </Bleed>

      <SearchAppsBottomSheet
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        searchQuery={urlSearchQuery}
        onSearchChange={handleSearchChange}
        apps={apps}
        selectedAppIds={selectedAppIds}
        selectionOrder={selectionOrder}
        onToggleApp={onToggleApp}
        isAtSelectionLimit={isAtSelectionLimit}
        hasVoted={hasVoted}
        isAutoVotingEnabled={isAutoVotingEnabled}
        isEditingAutoVote={isEditingAutoVote}
      />
    </>
  )
}
