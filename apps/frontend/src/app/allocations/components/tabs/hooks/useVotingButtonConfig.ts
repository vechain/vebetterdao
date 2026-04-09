"use client"

import { useContext, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { AllocationTabsContext } from "../AllocationTabsProvider"

export type VotingButtonType = "vote" | "editing" | "edit" | "enable"

export interface VotingButtonConfig {
  type: VotingButtonType
  primaryText: string
  primaryDisabled: boolean
  primaryOnClick: () => void
  // For editing mode (Cancel/Save)
  secondaryText?: string
  secondaryOnClick?: () => void
}

/**
 * Hook to determine which voting button(s) to show based on state.
 * Consumes AllocationTabsContext directly.
 */
export const useVotingButtonConfig = (): VotingButtonConfig | null => {
  const context = useContext(AllocationTabsContext)
  if (!context) throw new Error("useVotingButtonConfig must be used within AllocationTabsProvider")

  const {
    hasVoted,
    isEditingAutoVote,
    isAutoVotingEnabled,
    isAutoVotingEnabledInCurrentRound,
    hasExistingPreferences,
    hasAutoVoteChanges,
    selectedAppIds,
    isEligibleToVote,
    onVoteClick,
    onEditAutoVote,
    onCancelEditAutoVote,
    onSaveAutoVote,
    onEnableAutoVoting,
    isDelegatedToNavigator,
  } = context

  const { t } = useTranslation()

  return useMemo(() => {
    if (isDelegatedToNavigator) return null

    // Case 1: User is editing auto-vote preferences - show cancel/save buttons
    if (isEditingAutoVote) {
      return {
        type: "editing" as const,
        primaryText: t("Save"),
        primaryDisabled: !hasAutoVoteChanges || selectedAppIds.size === 0,
        primaryOnClick: onSaveAutoVote,
        secondaryText: t("Cancel"),
        secondaryOnClick: onCancelEditAutoVote,
      }
    }

    // Case 2: Auto-voting active (current status OR in current round) - show edit button
    // This includes users who disabled mid-round but were enabled at round start
    if (isAutoVotingEnabled || isAutoVotingEnabledInCurrentRound) {
      return {
        type: "edit" as const,
        primaryText: hasExistingPreferences ? t("Edit auto-vote settings") : t("Enable auto-vote"),
        primaryDisabled: false,
        primaryOnClick: onEditAutoVote,
      }
    }

    // Case 3: User hasn't voted yet - show vote button
    if (!hasVoted) {
      const count = selectedAppIds.size
      const text =
        count > 0
          ? count > 1
            ? t("Vote for {{count}} Apps", { count })
            : t("Vote for {{count}} App", { count })
          : t("Vote")

      return {
        type: "vote" as const,
        primaryText: text,
        primaryDisabled: !isEligibleToVote || count === 0,
        primaryOnClick: onVoteClick,
      }
    }

    // Case 4: User has voted + auto-voting NOT enabled - show enable button
    return {
      type: "enable" as const,
      primaryText: t("Enable auto-vote"),
      primaryDisabled: false,
      primaryOnClick: onEnableAutoVoting,
    }
  }, [
    isDelegatedToNavigator,
    hasVoted,
    isEditingAutoVote,
    isAutoVotingEnabled,
    isAutoVotingEnabledInCurrentRound,
    hasExistingPreferences,
    hasAutoVoteChanges,
    selectedAppIds.size,
    isEligibleToVote,
    onVoteClick,
    onEditAutoVote,
    onCancelEditAutoVote,
    onSaveAutoVote,
    onEnableAutoVoting,
    t,
  ])
}
