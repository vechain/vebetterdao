import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface State {
  language: string
  setLanguage: (language: string) => void
}

export const useLanguage = create<State>()(
  devtools(
    persist(
      set => ({
        language: "en",
        setLanguage: (language: string) => set({ language }),
      }),
      {
        name: "APP_LANGUAGE_STORE",
      },
    ),
  ),
)
