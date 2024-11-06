import { featureFlags, FeatureFlag } from "../constants"

export const useFeatureFlag = (flag: FeatureFlag) => {
  const isEnabled = featureFlags[flag].enabled
  const comingSoonText = featureFlags[flag].comingSoonText

  return {
    isEnabled,
    comingSoonText,
  }
}
