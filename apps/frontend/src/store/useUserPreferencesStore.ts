import { create, StoreApi } from "zustand"
import { devtools, persist } from "zustand/middleware"

import { BannerStorageKey } from "@/app/components/Banners/GenericBanner"

export type UserPreferences = {
  SHOW_AUTOVOTING_MODAL?: boolean
} & Partial<Record<BannerStorageKey, boolean>>

export type UserPreferencesStoreState = {
  data: UserPreferences
  defaults: UserPreferences
  setData: (preferences: UserPreferences) => void
  updateData: (updates: Partial<UserPreferences>) => void
  clearData: () => void
  setDefaults: (defaults: UserPreferences) => void
  getData: () => UserPreferences | null
}

// Map to store instances per wallet address
const storeMap = new Map<string, StoreApi<UserPreferencesStoreState>>()

/**
 * Creates an isolated user preferences store for a specific wallet address
 * Each wallet gets its own localStorage entry: USER_PREFERENCES_STORE_{walletAddress}
 */
export const createUserPreferencesStore = (walletAddress: string): StoreApi<UserPreferencesStoreState> => {
  if (storeMap.has(walletAddress)) {
    return storeMap.get(walletAddress)!
  }

  const store = create<UserPreferencesStoreState>()(
    devtools(
      persist(
        (set, get) => ({
          data: {},
          defaults: {},
          setData: (preferences: UserPreferences) =>
            set(() => ({
              data: preferences,
            })),
          updateData: (updates: Partial<UserPreferences>) =>
            set(state => ({
              data: {
                ...state.data,
                ...updates,
              },
            })),
          clearData: () =>
            set(() => ({
              data: {},
            })),
          setDefaults: (defaults: UserPreferences) => set({ defaults }),
          getData: () => {
            const state = get()
            return state.data && Object.keys(state.data).length > 0
              ? state.data
              : Object.keys(state.defaults).length > 0
                ? state.defaults
                : null
          },
        }),
        {
          name: `USER_PREFERENCES_STORE_${walletAddress}`,
        },
      ),
    ),
  )

  storeMap.set(walletAddress, store)
  return store
}

/**
 * Get store for a wallet address, returns null if not yet created
 */
export const getUserPreferencesStore = (walletAddress: string): StoreApi<UserPreferencesStoreState> | null => {
  return storeMap.get(walletAddress) ?? null
}

/**
 * Clear all store instances (useful for testing or logout)
 */
export const clearAllUserPreferencesStores = () => {
  storeMap.clear()
}
