import { CastAllocationVoteFormData } from "@/app/rounds/[roundId]/vote/percentages/components/SelectAppVotesInput"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

export type CastVoteData = CastAllocationVoteFormData["votes"]
export type ProposalFormStoreState = {
  data: CastVoteData
  setData: (_data: CastVoteData) => void
  clearData: () => void
}

/**
 * Store for the multi-step proposal form data
 */
export const useCastAllocationFormStore = create<ProposalFormStoreState>()(
  devtools(
    persist(
      (set, get) => ({
        data: [],
        setData: (data: CastVoteData) =>
          set({
            data,
          }),
        clearData: () =>
          set({
            data: [],
          }),
      }),
      {
        name: "CAST_ALLOCATION_FORM_STORE",
      },
    ),
  ),
)
