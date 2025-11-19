import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

import { BannerStorageKey } from "@/app/components/Banners/GenericBanner"

export type UserPreferences = {
  SHOW_AUTOVOTING_MODAL?: boolean
} & Partial<Record<BannerStorageKey, boolean>>

export type UserPreferencesStoreState = {
  preferences: Record<string, UserPreferences>
  defaults: UserPreferences
  setPreferences: (walletAddress: string, preferences: UserPreferences) => void
  updatePreferences: (walletAddress: string, updates: Partial<UserPreferences>) => void
  clearPreferences: (walletAddress: string) => void
  setDefaults: (defaults: UserPreferences) => void
  getPreferences: (walletAddress: string) => UserPreferences | null
}

/**
 * Store for user preferences keyed by wallet address
 */
export const useUserPreferencesStore = create<UserPreferencesStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        preferences: {},
        defaults: {},
        setPreferences: (walletAddress: string, preferences: UserPreferences) =>
          set(state => ({
            preferences: {
              ...state.preferences,
              [walletAddress]: preferences,
            },
          })),
        updatePreferences: (walletAddress: string, updates: Partial<UserPreferences>) =>
          set(state => ({
            preferences: {
              ...state.preferences,
              [walletAddress]: {
                ...(state.preferences[walletAddress] || {}),
                ...updates,
              },
            },
          })),
        clearPreferences: (walletAddress: string) =>
          set(state => {
            const { [walletAddress]: _, ...rest } = state.preferences
            return { preferences: rest }
          }),
        setDefaults: (defaults: UserPreferences) => set({ defaults }),
        getPreferences: (walletAddress: string) => {
          const state = get()
          const stored = state.preferences[walletAddress]
          return stored || (Object.keys(state.defaults).length > 0 ? state.defaults : null)
        },
      }),
      {
        name: "USER_PREFERENCES_STORE",
      },
    ),
  ),
)
