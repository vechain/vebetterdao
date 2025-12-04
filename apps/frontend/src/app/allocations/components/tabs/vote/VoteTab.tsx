"use client"

import { Bleed } from "@chakra-ui/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext, useState } from "react"
import { useTranslation } from "react-i18next"

import { SearchField } from "@/components/SearchField/SearchField"
import { useBreakpoints } from "@/hooks/useBreakpoints"

import { SearchAppsBottomSheet } from "../../SearchAppsBottomSheet"
import { VotingAlerts } from "../../VotingAlerts"
import { AllocationTabsContext } from "../AllocationTabsProvider"

import { AppCategoryTabs } from "./AppCategoryTabs"

export function VoteTab() {
  const { isMobile } = useBreakpoints()
  const { t } = useTranslation()

  const context = useContext(AllocationTabsContext)
  if (!context) throw new Error("VoteTab must be used within AllocationTabsProvider")

  const {
    apps,
    roundId,
    selectedAppIds,
    selectionOrder,
    onToggleApp,
    isStuck,
    hasVoted,
    isVoteDataLoading,
    isAutoVotingEnabled,
    isAutoVotingEnabledInCurrentRound,
    isEditingAutoVote,
    isAtSelectionLimit,
  } = context
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || "all"

  const [isSearchOpen, setIsSearchOpen] = useState(searchParams.has("search"))
  const [localSearchQuery, setLocalSearchQuery] = useState(searchParams.get("search") || "")

  const handleViewAll = () => setIsSearchOpen(true)
  const handleCloseSearch = () => setIsSearchOpen(false)

  const handleCategoryChange = useCallback(
    (category: string) => {
      const params = new URLSearchParams(searchParams)
      if (category !== "all") params.set("category", category)
      else params.delete("category")

      router.push(`?${params.toString()}`, { scroll: false })
    },
    [searchParams, router],
  )

  return (
    <>
      {isMobile && <VotingAlerts />}
      <SearchField
        placeholder={t("Search app")}
        value={localSearchQuery}
        onChange={setLocalSearchQuery}
        inputProps={{
          onFocus: e => {
            e.preventDefault()
            handleViewAll()
          },
        }}
        inputWrapperProps={{ hideFrom: "md" }}
      />
      <Bleed inlineStart="4" inlineEnd="4">
        <AppCategoryTabs
          apps={apps}
          selectedAppIds={selectedAppIds}
          selectionOrder={selectionOrder}
          onToggleApp={onToggleApp}
          onViewAll={handleViewAll}
          initialCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          searchQuery={localSearchQuery}
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
          hasVoted={hasVoted}
          isVoteDataLoading={isVoteDataLoading}
          isAutoVotingEnabled={isAutoVotingEnabled}
          isAutoVotingEnabledInCurrentRound={isAutoVotingEnabledInCurrentRound}
          isEditingAutoVote={isEditingAutoVote}
          isAtSelectionLimit={isAtSelectionLimit}
        />
      </Bleed>

      <SearchAppsBottomSheet
        roundId={roundId}
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        searchQuery={localSearchQuery}
        onSearchChange={setLocalSearchQuery}
        apps={apps}
        selectedAppIds={selectedAppIds}
        selectionOrder={selectionOrder}
        onToggleApp={onToggleApp}
        isAtSelectionLimit={isAtSelectionLimit}
        hasVoted={hasVoted}
        isVoteDataLoading={isVoteDataLoading}
        isAutoVotingEnabled={isAutoVotingEnabled}
        isAutoVotingEnabledInCurrentRound={isAutoVotingEnabledInCurrentRound}
        isEditingAutoVote={isEditingAutoVote}
      />
    </>
  )
}
