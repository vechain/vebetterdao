import { useMemo } from "react"

import { useCanUserVote } from "@/api/contracts/governance/hooks/useCanUserVote"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useIsAutoVotingEnabled } from "@/api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { useIsAutoVotingEnabledInCurrentRound } from "@/api/contracts/xAllocations/hooks/useIsAutoVotingEnabledInCurrentRound"
import { useUserVotingPreferences } from "@/api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { CastAllocationVoteFormData } from "@/store/useCastAllocationFormStore"

export type VotingFlowState = {
  // User status
  userStatus: {
    hasVoted: boolean | undefined
    canVote: boolean | undefined
    hasVotingPower: boolean | undefined
    isUpdatingPreferences: boolean
  }

  // Automation status
  automationStatus: {
    currentlyEnabled: boolean | undefined
    activeInCurrentRound: boolean | undefined
    userTogglingTo: boolean
    isEnabling: boolean
    isDisabling: boolean
    isDisablingInActiveRound: boolean
  }

  // Change detection
  changes: {
    automationChanged: boolean
    preferencesChanged: boolean
    hasAnyChanges: boolean
  }

  // Routing decisions
  navigation: {
    shouldGoToConfirm: boolean
    shouldGoToPercentages: boolean
    canAccessSelectionPage: boolean
    canAccessConfirmPage: boolean
  }

  // Transaction type
  transaction: {
    willCastVote: boolean
    willUpdateAutomationOnly: boolean
    willEnableAutomation: boolean
    willDisableAutomation: boolean
    willUpdatePreferences: boolean
  }

  // UI hints
  ui: {
    showUpdatingPreferencesAlert: boolean
    showAutoVotingActiveAlert: boolean
    showDisablingAutoVoteAlert: boolean
    showNoChangesWarning: boolean
    pageTitle: string
    confirmCardTitle: string
  }
}

type UseVotingFlowStateParams = {
  roundId: string
  account?: string
  selectedApps: CastAllocationVoteFormData[]
  isAutomationEnabled: boolean
}

/**
 * Centralized hook to manage voting flow state and conditions
 * Determines:
 * - What page user should see
 * - What actions are available
 * - What UI to show
 * - What transaction will be executed
 */
export const useVotingFlowState = ({
  roundId,
  account,
  selectedApps,
  isAutomationEnabled,
}: UseVotingFlowStateParams): VotingFlowState => {
  // Blockchain state
  const { data: hasVotedInRound } = useHasVotedInRound(roundId, account)
  const { data: currentAutoVotingStatus } = useIsAutoVotingEnabled(account)
  const { data: isAutoVotingEnabledInCurrentRound } = useIsAutoVotingEnabledInCurrentRound(account)
  const { data: currentVotingPreferences } = useUserVotingPreferences(account)
  const shouldSeeVotePage = useCanUserVote()

  return useMemo(() => {
    // User status
    const userStatus = {
      hasVoted: hasVotedInRound,
      canVote: shouldSeeVotePage.data,
      hasVotingPower: shouldSeeVotePage.data,
      isUpdatingPreferences: hasVotedInRound ?? false,
    }

    // Automation status
    const automationStatus = {
      currentlyEnabled: currentAutoVotingStatus,
      activeInCurrentRound: isAutoVotingEnabledInCurrentRound,
      userTogglingTo: isAutomationEnabled,
      isEnabling: !currentAutoVotingStatus && isAutomationEnabled,
      isDisabling: !!currentAutoVotingStatus && !isAutomationEnabled,
      isDisablingInActiveRound: !!isAutoVotingEnabledInCurrentRound && !isAutomationEnabled,
    }

    // Change detection
    const automationChanged = currentAutoVotingStatus !== isAutomationEnabled
    // Preferences only matter when automation is enabled
    const preferencesChanged =
      isAutomationEnabled &&
      JSON.stringify(currentVotingPreferences?.sort()) !== JSON.stringify(selectedApps.map(app => app.appId).sort())

    // Routing decisions
    const shouldGoToConfirm = !!hasVotedInRound || !!isAutoVotingEnabledInCurrentRound || isAutomationEnabled
    const shouldGoToPercentages = !hasVotedInRound && !isAutoVotingEnabledInCurrentRound && !isAutomationEnabled

    const navigation = {
      shouldGoToConfirm,
      shouldGoToPercentages,
      canAccessSelectionPage: shouldSeeVotePage.data || !!hasVotedInRound,
      canAccessConfirmPage:
        (!hasVotedInRound && shouldSeeVotePage.data && selectedApps.length > 0) ||
        (!!hasVotedInRound && selectedApps.length > 0),
    }

    // Transaction type
    const willCastVote = !hasVotedInRound && !isAutoVotingEnabledInCurrentRound
    const willUpdateAutomationOnly = !!hasVotedInRound

    // Has changes if:
    // 1. Automation status changed, OR
    // 2. App preferences changed (when automation is enabled), OR
    // 3. Will cast a vote (new vote, not just updating preferences)
    const hasAnyChanges = automationChanged || preferencesChanged || willCastVote

    const changes = {
      automationChanged,
      preferencesChanged,
      hasAnyChanges,
    }

    const transaction = {
      willCastVote,
      willUpdateAutomationOnly,
      willEnableAutomation: !currentAutoVotingStatus && isAutomationEnabled,
      willDisableAutomation: !!currentAutoVotingStatus && !isAutomationEnabled,
      willUpdatePreferences: isAutomationEnabled && preferencesChanged,
    }

    // UI hints
    const ui = {
      showUpdatingPreferencesAlert: !!hasVotedInRound,
      showAutoVotingActiveAlert: !!isAutoVotingEnabledInCurrentRound,
      showDisablingAutoVoteAlert: !!isAutoVotingEnabledInCurrentRound && !isAutomationEnabled,
      showNoChangesWarning: !changes.hasAnyChanges,
      pageTitle: hasVotedInRound ? "Update Automation Preferences" : "Cast Your Vote",
      confirmCardTitle: hasVotedInRound ? "Your automation preferences" : "Your vote",
    }

    return {
      userStatus,
      automationStatus,
      changes,
      navigation,
      transaction,
      ui,
    }
  }, [
    hasVotedInRound,
    currentAutoVotingStatus,
    isAutoVotingEnabledInCurrentRound,
    currentVotingPreferences,
    shouldSeeVotePage.data,
    selectedApps,
    isAutomationEnabled,
  ])
}
