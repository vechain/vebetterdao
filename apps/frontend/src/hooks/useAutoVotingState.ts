import { useMemo } from "react"

export type AutoVotingStateProps = {
  isAutoVotingEnabled: boolean // Desired state (UI Toggle)
  isAutoVotingEnabledOnChain: boolean // Current chain state
  selectedAppIds: string[] // App IDs from UI
  currentPreferences: string[] // App IDs from contract
  hasVoted: boolean // User voted in current round
}

export type AutoVotingState = {
  shouldEnable: boolean
  shouldDisable: boolean
  preferencesChanged: boolean
  needsPreferenceUpdate: boolean
  isStandardVote: boolean
}

/**
 * Pure utility to calculate auto-voting state logic
 */
export const getAutoVotingState = ({
  isAutoVotingEnabled,
  isAutoVotingEnabledOnChain,
  selectedAppIds,
  currentPreferences = [],
  hasVoted,
}: AutoVotingStateProps): AutoVotingState => {
  // 1. Detect State Change
  const autoVotingStateChanged = isAutoVotingEnabled !== isAutoVotingEnabledOnChain
  const shouldEnable = autoVotingStateChanged && isAutoVotingEnabled
  const shouldDisable = autoVotingStateChanged && !isAutoVotingEnabled

  // 2. Detect Preference Change
  const preferencesChanged =
    currentPreferences.length !== selectedAppIds.length ||
    !selectedAppIds.every(appId => currentPreferences.includes(appId))

  // 3. Determine if Preference Update is needed
  let needsPreferenceUpdate = false

  if (shouldEnable) {
    // When enabling: update unless we already voted AND preferences are unchanged (optimization)
    needsPreferenceUpdate = !hasVoted || preferencesChanged
  } else if (isAutoVotingEnabled && isAutoVotingEnabledOnChain) {
    // When already enabled: only update if preferences changed
    needsPreferenceUpdate = preferencesChanged
  }

  // Standard vote means we are just voting, not touching auto-voting
  const isStandardVote = !autoVotingStateChanged && !isAutoVotingEnabled

  return {
    shouldEnable,
    shouldDisable,
    preferencesChanged,
    needsPreferenceUpdate,
    isStandardVote,
  }
}

/**
 * Hook wrapper for getAutoVotingState
 */
export const useAutoVotingState = (props: AutoVotingStateProps) => {
  return useMemo(
    () => getAutoVotingState(props),
    [
      props.isAutoVotingEnabled,
      props.isAutoVotingEnabledOnChain,
      props.currentPreferences,
      props.selectedAppIds,
      props.hasVoted,
    ],
  )
}
