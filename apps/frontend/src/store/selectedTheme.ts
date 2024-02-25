import { lightTheme } from "@/app/theme"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface State {
  selectedTheme: Record<string, unknown>
  setSelectedTheme: (selectedTheme: Record<string, unknown>) => void
}

export const useSelectedTheme = create<State>()(
  devtools(
    persist(
      (set, get) => ({
        selectedTheme: lightTheme,
        setSelectedTheme: (selectedTheme: Record<string, unknown>) => set({ selectedTheme }),
      }),
      {
        name: "SELECTED_THEME_STORE",
      },
    ),
  ),
)
