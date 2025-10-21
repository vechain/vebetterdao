import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type CastAllocationVoteFormData = {
  appId: string
  value: string | number
  rawValue: number
}
export type CastAllocationFormStoreState = {
  data: CastAllocationVoteFormData[]
  isAutomationEnabled: boolean
  setData: (_data: CastAllocationVoteFormData[]) => void
  setIsAutomationEnabled: (_isAutomationEnabled: boolean) => void
  clearData: () => void
  filterValidApps: (validAppIds: string[]) => void
}
/**
 * Store for the multi-step proposal form data
 */
export const useCastAllocationFormStore = create<CastAllocationFormStoreState>()(
  devtools(
    persist(
      set => ({
        data: [],
        isAutomationEnabled: false,
        setData: (data: CastAllocationVoteFormData[]) =>
          set({
            data,
          }),
        setIsAutomationEnabled: (isAutomationEnabled: boolean) =>
          set({
            isAutomationEnabled,
          }),
        clearData: () =>
          set({
            data: [],
            isAutomationEnabled: false,
          }),
        filterValidApps: (validAppIds: string[]) =>
          set(state => ({
            data: state.data.filter(vote => validAppIds.includes(vote.appId)),
          })),
      }),
      {
        name: "CAST_ALLOCATION_FORM_STORE",
      },
    ),
  ),
)
