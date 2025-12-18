"use client"

import { useTranslation } from "react-i18next"

import type { AppWithVotes } from "@/app/allocations/lib/data"
import { SearchBottomSheet } from "@/components/SearchBottomSheet"

import { AppCategoryTabs } from "./tabs/vote/AppCategoryTabs"

interface SearchAppsBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  apps?: AppWithVotes[]
  roundId: string
  selectedAppIds?: Set<string>
  onToggleApp?: (appId: string) => void
  isAtSelectionLimit?: boolean
  hasVoted?: boolean
  isVoteDataLoading?: boolean
  isAutoVotingEnabled?: boolean
  isAutoVotingEnabledInCurrentRound?: boolean
  isEditingAutoVote?: boolean
}

export function SearchAppsBottomSheet({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  apps = [],
  roundId,
  selectedAppIds,
  onToggleApp,
  isAtSelectionLimit = false,
  hasVoted = false,
  isVoteDataLoading = false,
  isAutoVotingEnabled = false,
  isAutoVotingEnabledInCurrentRound = false,
  isEditingAutoVote = false,
}: SearchAppsBottomSheetProps) {
  const { t } = useTranslation()

  return (
    <SearchBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      placeholder={t("Search app")}
      ariaTitle={t("Search Apps")}
      ariaDescription={t("Search and filter applications")}>
      <AppCategoryTabs
        apps={apps}
        roundId={roundId}
        searchQuery={searchQuery}
        selectedAppIds={selectedAppIds}
        onToggleApp={onToggleApp}
        showEmptyState
        tabsListProps={{ mb: "0" }}
        isAtSelectionLimit={isAtSelectionLimit}
        hasVoted={hasVoted}
        isVoteDataLoading={isVoteDataLoading}
        isAutoVotingEnabled={isAutoVotingEnabled}
        isAutoVotingEnabledInCurrentRound={isAutoVotingEnabledInCurrentRound}
        isEditingAutoVote={isEditingAutoVote}
      />
    </SearchBottomSheet>
  )
}
