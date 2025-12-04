"use client"

import { CloseButton, Flex, IconButton, Input, InputGroup } from "@chakra-ui/react"
import { NavArrowLeft } from "iconoir-react"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

import type { AppWithVotes } from "@/app/allocations/lib/data"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"

import { AppCategoryTabs } from "./tabs/vote/AppCategoryTabs"

interface SearchAppsBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  apps?: AppWithVotes[]
  roundId: string
  selectedAppIds?: Set<string>
  selectionOrder?: string[]
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
  selectionOrder = [],
  onToggleApp,
  isAtSelectionLimit = false,
  hasVoted = false,
  isVoteDataLoading = false,
  isAutoVotingEnabled = false,
  isAutoVotingEnabledInCurrentRound = false,
  isEditingAutoVote = false,
}: SearchAppsBottomSheetProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    onSearchChange("")
    onClose()
  }

  const handleClear = () => {
    onSearchChange("")
    inputRef.current?.focus()
  }

  return (
    <BaseBottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      ariaTitle={t("Search Apps")}
      ariaDescription={t("Search and filter applications")}
      isDismissable={true}
      minHeight="100dvh">
      <Flex gap="4" mb="4" alignItems="center" justifyContent="space-between">
        <IconButton minWidth="unset" variant="ghost" boxSize="6" p="0" rounded="full" onClick={handleClose}>
          <NavArrowLeft />
        </IconButton>
        <InputGroup
          flex={1}
          rounded="lg"
          borderColor="border.primary"
          endElement={searchQuery ? <CloseButton size="xs" onClick={handleClear} me="-2" /> : undefined}>
          <Input
            ref={inputRef}
            bg="bg.primary"
            id="search-apps-input"
            placeholder={t("Search app")}
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            autoFocus
            px="3"
          />
        </InputGroup>
      </Flex>

      <AppCategoryTabs
        apps={apps}
        roundId={roundId}
        searchQuery={searchQuery}
        selectedAppIds={selectedAppIds}
        selectionOrder={selectionOrder}
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
    </BaseBottomSheet>
  )
}
