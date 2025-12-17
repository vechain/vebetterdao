"use client"

import { Bleed } from "@chakra-ui/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useContext, useMemo, useState } from "react"
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
    onToggleApp,
    isStuck,
    hasVoted,
    hasVotedLoading,
    hasEnoughVotesAtSnapshot,
    isVoteDataLoading,
    isAutoVotingEnabled,
    isAutoVotingEnabledInCurrentRound,
    isEditingAutoVote,
    isAtSelectionLimit,
  } = context
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || "all"
  const shouldShowInsufficientPowerAlert = useMemo(
    () => !hasVotedLoading && !hasVoted && !hasEnoughVotesAtSnapshot,
    [hasVotedLoading, hasVoted, hasEnoughVotesAtSnapshot],
  )

  const [isSearchOpen, setIsSearchOpen] = useState(searchParams.has("search"))
  const [localSearchQuery, setLocalSearchQuery] = useState(searchParams.get("search") || "")

  const sortedApps = useMemo(() => {
    if (!hasVoted || isEditingAutoVote) return apps
    return [...apps].sort((a, b) => {
      const aVoted = selectedAppIds.has(a.id)
      const bVoted = selectedAppIds.has(b.id)
      if (aVoted && !bVoted) return -1
      if (!aVoted && bVoted) return 1
      return 0
    })
  }, [hasVoted, isEditingAutoVote, apps, selectedAppIds])

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
          readOnly: true,
          onClick: e => {
            e.preventDefault()
            setIsSearchOpen(true)
          },
        }}
        inputWrapperProps={{ hideFrom: "md" }}
      />
      <Bleed inlineStart="4" inlineEnd="4">
        <AppCategoryTabs
          disabled={shouldShowInsufficientPowerAlert}
          apps={sortedApps}
          selectedAppIds={selectedAppIds}
          onToggleApp={onToggleApp}
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
        apps={sortedApps}
        selectedAppIds={selectedAppIds}
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
