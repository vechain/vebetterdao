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

const ANONYMOUS_STORE_KEY = "anonymous"

/**
 * Hook for getting and managing user preferences based on connected wallet address
 * When logged out, uses an anonymous store so dismissable banners (e.g. NewAppBanner) can still be closed.
 */
export const useUserPreferences = (): UseUserPreferencesReturn => {
  const { account } = useWallet()
  const walletAddress = account?.address ?? ANONYMOUS_STORE_KEY

  const store = useMemo(() => createUserPreferencesStore(walletAddress), [walletAddress])

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

  if (!storeState) {
    return {
      preferences: null,
      setPreferences: () => {},
      updatePreferences: () => {},
      clearPreferences: () => {},
      setDefaults: () => {},
    }
  }

  return {
    preferences: storeState.getData() ?? {},
    setPreferences: (preferences: UserPreferences) => storeState.setData(preferences),
    updatePreferences: (updates: Partial<UserPreferences>) => storeState.updateData(updates),
    clearPreferences: () => storeState.clearData(),
    setDefaults: (defaults: UserPreferences) => storeState.setDefaults(defaults),
  }
}
