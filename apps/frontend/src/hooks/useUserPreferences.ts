"use client"

import { useWallet } from "@vechain/vechain-kit"

import { useUserPreferencesStore, UserPreferences } from "@/store/useUserPreferencesStore"

export type UseUserPreferencesReturn = {
  preferences: UserPreferences | null
  setPreferences: (preferences: UserPreferences) => void
  updatePreferences: (updates: Partial<UserPreferences>) => void
  clearPreferences: () => void
  setDefaults: (defaults: UserPreferences) => void
}

/**
 * Hook for getting and managing user preferences based on connected wallet address
 * Returns wallet-specific preferences if stored, otherwise returns default preferences
 * Returns null when no wallet is connected and no defaults set
 */
export const useUserPreferences = (): UseUserPreferencesReturn => {
  const { account } = useWallet()
  const { setPreferences, updatePreferences, clearPreferences, setDefaults, getPreferences } = useUserPreferencesStore()

  const walletAddress = account?.address

  if (!walletAddress) {
    return {
      preferences: null,
      setPreferences: () => {},
      updatePreferences: () => {},
      clearPreferences: () => {},
      setDefaults: () => {},
    }
  }

  return {
    preferences: getPreferences(walletAddress),
    setPreferences: (preferences: UserPreferences) => setPreferences(walletAddress, preferences),
    updatePreferences: (updates: Partial<UserPreferences>) => updatePreferences(walletAddress, updates),
    clearPreferences: () => clearPreferences(walletAddress),
    setDefaults,
  }
}
