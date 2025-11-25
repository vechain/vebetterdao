"use client"

import { useCallback, useMemo, useState } from "react"

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

  // Check if user has existing preferences on chain
  const hasExistingPreferences = storedPreferences.length > 0

  // Check if preferences have changed from chain state
  // For enable mode (no existing preferences): any selection is valid
  // For edit mode: compare against existing preferences
  const hasAutoVoteChanges = useMemo(() => {
    if (!isEditingAutoVote) return false
    // Enable mode: any selection counts as a valid change
    if (!hasExistingPreferences) return selectedAppIds.size > 0
    // Edit mode: compare against existing preferences
    const selectedIds = Array.from(selectedAppIds)
    return storedPreferences.length !== selectedIds.length || !selectedIds.every(id => storedPreferences.includes(id))
  }, [isEditingAutoVote, selectedAppIds, storedPreferences, hasExistingPreferences])

  // Get apps to preselect: stored preferences (priority) or voted apps
  const getAppsToPreselect = useCallback(() => {
    return storedPreferences.length > 0
      ? new Set(storedPreferences)
      : votedAppIds
        ? new Set(votedAppIds)
        : new Set<string>()
  }, [storedPreferences, votedAppIds])

  // Enter edit mode - load preferences from chain (priority) or voted apps
  const handleEditAutoVote = useCallback(() => {
    const appsToPreselect = getAppsToPreselect()
    setSelectedAppIds(appsToPreselect)
    onSelectedAppsChange?.(appsToPreselect)
    setIsEditingAutoVote(true)
  }, [getAppsToPreselect, setSelectedAppIds, onSelectedAppsChange])

  // Cancel edit mode - reload from chain state
  const handleCancelEditAutoVote = useCallback(() => {
    const appsToRestore = getAppsToPreselect()
    setSelectedAppIds(appsToRestore)
    onSelectedAppsChange?.(appsToRestore)
    setIsEditingAutoVote(false)
  }, [getAppsToPreselect, setSelectedAppIds, onSelectedAppsChange])

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
    hasExistingPreferences,
    handleEditAutoVote,
    handleCancelEditAutoVote,
    handleSaveAutoVote,
    resetEditMode,
  }
}
