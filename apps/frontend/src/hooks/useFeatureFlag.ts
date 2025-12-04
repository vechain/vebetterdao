"use client"

import { FeatureFlag, featureFlags } from "@/constants/featureFlag"

/**
 * Client-side hook for feature flag evaluation.
 *
 * @deprecated For new code, prefer server-side flag evaluation using the `flags` package:
 * - Import from `flags/next`
 * - Use in Server Components with `await flagName()`
 * - Provides better performance and Vercel Toolbar integration
 *
 * This hook is maintained for backward compatibility with existing client components.
 */
export const useFeatureFlag = (flag: FeatureFlag) => {
  const isEnabled = featureFlags[flag].enabled
  const comingSoonText = featureFlags[flag].comingSoonText
  return {
    isEnabled,
    comingSoonText,
  }
}
