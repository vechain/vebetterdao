import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type CastAllocationVoteFormData = {
  appId: string
  value: string | number
  rawValue: number
}
export type CastAllocationFormStoreState = {
  data: CastAllocationVoteFormData[]
  setData: (_data: CastAllocationVoteFormData[]) => void
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
        setData: (data: CastAllocationVoteFormData[]) =>
          set({
            data,
          }),
        clearData: () =>
          set({
            data: [],
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
