import { useIsPassportCheckEnabled } from "."

/**
 * Hook to get the status of all passport checks
 * @returns the status of all passport checks as booleans
 */
export const usePassportChecks = () => {
  const { data: isWhiteListCheckEnabled } = useIsPassportCheckEnabled("whitelistCheckEnabled")
  const { data: isBlackListCheckEnabled } = useIsPassportCheckEnabled("blacklistCheckEnabled")
  const { data: isSignalingCheckEnabled } = useIsPassportCheckEnabled("signalingCheckEnabled")
  const { data: isParticipationScoreCheckEnabled } = useIsPassportCheckEnabled("participationScoreCheckEnabled")
  const { data: isNodeOwnershipCheckEnabled } = useIsPassportCheckEnabled("nodeOwnershipCheckEnabled")
  const { data: isGMOwnershipCheckEnabled } = useIsPassportCheckEnabled("gmOwnershipCheckEnabled")

  return {
    isWhiteListCheckEnabled,
    isBlackListCheckEnabled,
    isSignalingCheckEnabled,
    isParticipationScoreCheckEnabled,
    isNodeOwnershipCheckEnabled,
    isGMOwnershipCheckEnabled,
  }
}
