"use client"

import { useCallback, useMemo, useState } from "react"

interface UseAutoVoteEditModeProps {
  storedPreferences: string[]
  votedAppIds?: string[]
  hasVoted: boolean
  selectedAppIds: Set<string>
  setSelectedAppIds: (ids: Set<string>) => void
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
  // Set maintains insertion order, so we just need to create Set from the ordered array
  const getAppsToPreselect = useCallback((): Set<string> => {
    if (storedPreferences.length > 0) {
      return new Set(storedPreferences)
    }
    if (votedAppIds) {
      return new Set(votedAppIds)
    }
    return new Set<string>()
  }, [storedPreferences, votedAppIds])

  // Enter edit mode - load preferences from chain (priority) or voted apps
  const handleEditAutoVote = useCallback(() => {
    const ids = getAppsToPreselect()
    setSelectedAppIds(ids)
    setIsEditingAutoVote(true)
  }, [getAppsToPreselect, setSelectedAppIds])

  // Cancel edit mode - reset to read-only state (voted apps or empty)
  const handleCancelEditAutoVote = useCallback(() => {
    if (hasVoted && votedAppIds) {
      // User has voted - show their voted apps (Set maintains order from votedAppIds)
      const votedApps = new Set(votedAppIds)
      setSelectedAppIds(votedApps)
    } else {
      // User hasn't voted - show empty read-only state
      setSelectedAppIds(new Set())
    }
    setIsEditingAutoVote(false)
  }, [hasVoted, votedAppIds, setSelectedAppIds])

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
