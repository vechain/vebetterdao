import { FeatureFlag, featureFlags } from "@/constants/featureFlag"

export const useFeatureFlag = (flag: FeatureFlag) => {
  const isEnabled = featureFlags[flag].enabled
  const comingSoonText = featureFlags[flag].comingSoonText
  return {
    isEnabled,
    comingSoonText,
  }
}
