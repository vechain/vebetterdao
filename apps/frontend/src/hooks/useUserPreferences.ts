"use client"

import { useWallet } from "@vechain/vechain-kit"
import { useEffect, useMemo, useState } from "react"

import {
  createUserPreferencesStore,
  type UserPreferences,
  type UserPreferencesStoreState,
} from "@/store/useUserPreferencesStore"

export type UseUserPreferencesReturn = {
  preferences: UserPreferences | null
  setPreferences: (preferences: UserPreferences) => void
  updatePreferences: (updates: Partial<UserPreferences>) => void
  clearPreferences: () => void
  setDefaults: (defaults: UserPreferences) => void
}

/**
 * Hook for getting and managing user preferences based on connected wallet address
 * Automatically creates/retrieves isolated store for current wallet
 * Subscribes to store changes for instant UI updates
 * Returns wallet-specific preferences if stored, otherwise returns default preferences
 * Returns null when no wallet is connected and no defaults set
 */
export const useUserPreferences = (): UseUserPreferencesReturn => {
  const { account } = useWallet()
  const walletAddress = account?.address

  const store = useMemo(() => {
    if (!walletAddress) return null
    return createUserPreferencesStore(walletAddress)
  }, [walletAddress])

  const [storeState, setStoreState] = useState<UserPreferencesStoreState | null>(() => {
    if (!store) return null
    return store.getState()
  })

  useEffect(() => {
    if (!store) {
      setStoreState(null)
      return
    }

    setStoreState(store.getState())

    const unsubscribe = store.subscribe(newState => {
      setStoreState(newState)
    })

    return unsubscribe
  }, [store])

  if (!walletAddress || !storeState) {
    return {
      preferences: null,
      setPreferences: () => {},
      updatePreferences: () => {},
      clearPreferences: () => {},
      setDefaults: () => {},
    }
  }

  return {
    preferences: storeState.getData(),
    setPreferences: (preferences: UserPreferences) => storeState.setData(preferences),
    updatePreferences: (updates: Partial<UserPreferences>) => storeState.updateData(updates),
    clearPreferences: () => storeState.clearData(),
    setDefaults: (defaults: UserPreferences) => storeState.setDefaults(defaults),
  }
}
