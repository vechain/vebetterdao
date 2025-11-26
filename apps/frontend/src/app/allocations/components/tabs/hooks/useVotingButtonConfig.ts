"use client"

import { useMemo } from "react"
import { useTranslation } from "react-i18next"

interface UseVotingButtonConfigProps {
  hasVoted: boolean
  isEditingAutoVote: boolean
  isAutoVotingEnabled: boolean
  hasExistingPreferences: boolean
  hasAutoVoteChanges: boolean
  selectedAppIds: Set<string>
  hasEnoughVotesAtSnapshot: boolean
  onVoteClick: () => void
  onEditAutoVote: () => void
  onCancelEditAutoVote: () => void
  onSaveAutoVote: () => void
  onEnableAutoVoting: () => void
}

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
 */
export const useVotingButtonConfig = ({
  hasVoted,
  isEditingAutoVote,
  isAutoVotingEnabled,
  hasExistingPreferences,
  hasAutoVoteChanges,
  selectedAppIds,
  hasEnoughVotesAtSnapshot,
  onVoteClick,
  onEditAutoVote,
  onCancelEditAutoVote,
  onSaveAutoVote,
  onEnableAutoVoting,
}: UseVotingButtonConfigProps): VotingButtonConfig => {
  const { t } = useTranslation()

  return useMemo(() => {
    // Case 1: User hasn't voted yet - show vote button
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
        primaryDisabled: !hasEnoughVotesAtSnapshot || count === 0,
        primaryOnClick: onVoteClick,
      }
    }

    // Case 2: User is editing auto-vote preferences - show cancel/save buttons
    if (isEditingAutoVote) {
      return {
        type: "editing" as const,
        primaryText: t("Save Auto-Vote"),
        primaryDisabled: !hasAutoVoteChanges,
        primaryOnClick: onSaveAutoVote,
        secondaryText: t("Cancel Edit"),
        secondaryOnClick: onCancelEditAutoVote,
      }
    }

    // Case 3: User has voted + auto-voting enabled - show edit button
    if (isAutoVotingEnabled) {
      return {
        type: "edit" as const,
        primaryText: hasExistingPreferences ? t("Edit Auto-Vote") : t("Enable Auto-Voting & Claim"),
        primaryDisabled: false,
        primaryOnClick: onEditAutoVote,
      }
    }

    // Case 4: User has voted + auto-voting NOT enabled - show enable button
    return {
      type: "enable" as const,
      primaryText: t("Enable Auto-Voting & Claim"),
      primaryDisabled: false,
      primaryOnClick: onEnableAutoVoting,
    }
  }, [
    hasVoted,
    isEditingAutoVote,
    isAutoVotingEnabled,
    hasExistingPreferences,
    hasAutoVoteChanges,
    selectedAppIds.size,
    hasEnoughVotesAtSnapshot,
    onVoteClick,
    onEditAutoVote,
    onCancelEditAutoVote,
    onSaveAutoVote,
    onEnableAutoVoting,
    t,
  ])
}
