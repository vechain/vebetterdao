"use client"

import { useCallback, useMemo, useState } from "react"

interface UseAutoVoteEditModeProps {
  storedPreferences: string[]
  votedAppIds?: string[]
  hasVoted: boolean
  selectedAppIds: Set<string>
  setSelectedAppIds: (ids: Set<string>) => void
  setSelectionOrder: (order: string[]) => void
  onSelectedAppsChange?: (ids: Set<string>) => void
  openModal: () => void
}

/**
 * Hook to manage auto-vote edit mode state and actions
 */
export const useAutoVoteEditMode = ({
  storedPreferences,
  votedAppIds,
  hasVoted,
  selectedAppIds,
  setSelectedAppIds,
  setSelectionOrder,
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
  // Returns both the Set and the order array
  const getAppsToPreselect = useCallback((): { ids: Set<string>; order: string[] } => {
    if (storedPreferences.length > 0) {
      return { ids: new Set(storedPreferences), order: storedPreferences }
    }
    if (votedAppIds) {
      return { ids: new Set(votedAppIds), order: votedAppIds }
    }
    return { ids: new Set<string>(), order: [] }
  }, [storedPreferences, votedAppIds])

  // Enter edit mode - load preferences from chain (priority) or voted apps
  const handleEditAutoVote = useCallback(() => {
    const { ids, order } = getAppsToPreselect()
    setSelectedAppIds(ids)
    setSelectionOrder(order)
    onSelectedAppsChange?.(ids)
    setIsEditingAutoVote(true)
  }, [getAppsToPreselect, setSelectedAppIds, setSelectionOrder, onSelectedAppsChange])

  // Cancel edit mode - reset to read-only state (voted apps or empty)
  const handleCancelEditAutoVote = useCallback(() => {
    if (hasVoted && votedAppIds) {
      // User has voted - show their voted apps
      const votedApps = new Set(votedAppIds)
      setSelectedAppIds(votedApps)
      setSelectionOrder(votedAppIds)
      onSelectedAppsChange?.(votedApps)
    } else {
      // User hasn't voted - show empty read-only state
      setSelectedAppIds(new Set())
      setSelectionOrder([])
      onSelectedAppsChange?.(new Set())
    }
    setIsEditingAutoVote(false)
  }, [hasVoted, votedAppIds, setSelectedAppIds, setSelectionOrder, onSelectedAppsChange])

  // Save auto-vote preferences (triggers confirm modal)
  const handleSaveAutoVote = useCallback(() => {
    openModal()
  }, [openModal])

  // Reset edit mode (call after successful save)
  const resetEditMode = useCallback(() => {
    setIsEditingAutoVote(false)
  }, [])

  // Enter edit mode without resetting selections (for "Edit selection" from modal)
  const enterEditMode = useCallback(() => {
    setIsEditingAutoVote(true)
  }, [])

  return {
    isEditingAutoVote,
    hasAutoVoteChanges,
    hasExistingPreferences,
    handleEditAutoVote,
    handleCancelEditAutoVote,
    handleSaveAutoVote,
    resetEditMode,
    enterEditMode,
  }
}
