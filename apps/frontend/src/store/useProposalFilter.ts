// Zustand to save the selected filters for the proposals
import { ProposalFilter, StateFilter } from "@/app/proposals"
import { create } from "zustand"

interface ProposalFilterStoreState {
  selectedFilter: ProposalFilter | StateFilter | undefined
  setSelectedFilter: (filter: ProposalFilter | StateFilter | undefined) => void
  clearFilter: () => void
}

export const useProposalFilter = create<ProposalFilterStoreState>(set => ({
  selectedFilter: undefined,
  setSelectedFilter: filter => set({ selectedFilter: filter }),
  clearFilter: () => set({ selectedFilter: undefined }),
}))
