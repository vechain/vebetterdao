"use client"

import { useCallback, useState } from "react"

import { getAutoVotingState } from "@/hooks/useAutoVotingState"

interface UseAutoVoteEditModeProps {
  storedPreferences: string[]
  votedAppIds?: string[]
  selectedAppIds: Set<string>
  setSelectedAppIds: (ids: Set<string>) => void
  onSelectedAppsChange?: (ids: Set<string>) => void
  openModal: () => void
}

/**
 * Hook to manage auto-vote edit mode state and actions
 * Leverages getAutoVotingState for preference change detection
 */
export const useAutoVoteEditMode = ({
  storedPreferences,
  votedAppIds,
  selectedAppIds,
  setSelectedAppIds,
  onSelectedAppsChange,
  openModal,
}: UseAutoVoteEditModeProps) => {
  const [isEditingAutoVote, setIsEditingAutoVote] = useState(false)

  // Use getAutoVotingState to detect if preferences have changed from chain state
  const { preferencesChanged } = getAutoVotingState({
    isAutoVotingEnabled: true,
    isAutoVotingEnabledOnChain: true,
    selectedAppIds: Array.from(selectedAppIds),
    currentPreferences: storedPreferences,
    hasVoted: true,
  })

  // Only show "Save" as enabled when editing AND preferences differ from chain
  const hasAutoVoteChanges = isEditingAutoVote && preferencesChanged

  // Enter edit mode - load preferences from chain (priority) or voted apps
  const handleEditAutoVote = useCallback(() => {
    const appsToPreselect =
      storedPreferences.length > 0 ? new Set(storedPreferences) : votedAppIds ? new Set(votedAppIds) : new Set<string>()

    setSelectedAppIds(appsToPreselect)
    onSelectedAppsChange?.(appsToPreselect)
    setIsEditingAutoVote(true)
  }, [storedPreferences, votedAppIds, setSelectedAppIds, onSelectedAppsChange])

  // Cancel edit mode - reload from chain state
  const handleCancelEditAutoVote = useCallback(() => {
    const appsToRestore =
      storedPreferences.length > 0 ? new Set(storedPreferences) : votedAppIds ? new Set(votedAppIds) : new Set<string>()

    setSelectedAppIds(appsToRestore)
    onSelectedAppsChange?.(appsToRestore)
    setIsEditingAutoVote(false)
  }, [storedPreferences, votedAppIds, setSelectedAppIds, onSelectedAppsChange])

  // Save auto-vote preferences (triggers confirm modal)
  const handleSaveAutoVote = useCallback(() => {
    openModal()
  }, [openModal])

  // Reset edit mode (call after successful save)
  const resetEditMode = useCallback(() => {
    setIsEditingAutoVote(false)
  }, [])

  return {
    isEditingAutoVote,
    hasAutoVoteChanges,
    handleEditAutoVote,
    handleCancelEditAutoVote,
    handleSaveAutoVote,
    resetEditMode,
  }
}
